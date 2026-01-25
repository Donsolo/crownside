const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Helper to hash IP for basic privacy (daily salt could be better, but simple hash for now)
const hashIp = (ip) => {
    return crypto.createHash('sha256').update(ip || 'unknown').digest('hex');
};

const logVisit = async (req, res) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const ipHash = hashIp(ip);
        const { path, sessionToken, userId } = req.body;

        // Simple duplicate check: 
        // If we have logged this IP for this path in the last 30 minutes, ignore?
        // OR just log everything and aggregate "unique IPs" per day later. 
        // Let's log everything for granularity but keep it lightweight.

        await prisma.trafficLog.create({
            data: {
                ipHash,
                sessionToken: sessionToken || null,
                userId: userId || null,
                path: path || '/',
                userAgent: req.headers['user-agent'] || null
            }
        });

        res.status(200).json({ ok: true });
    } catch (error) {
        console.error('Visit Log Error:', error);
        // Don't fail the client for analytics errors
        res.status(200).json({ ok: true });
    }
};

const getTrafficStats = async (req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Daily Visitors (Unique IPs last 24h)
        const dailyVisitors = await prisma.trafficLog.groupBy({
            by: ['ipHash'],
            where: {
                createdAt: { gte: last24h }
            }
        });

        // 2. Weekly Visitors (Unique IPs last 7 days)
        const weeklyVisitors = await prisma.trafficLog.groupBy({
            by: ['ipHash'],
            where: {
                createdAt: { gte: last7d }
            }
        });

        // 3. Monthly Visitors (Unique IPs last 30 days)
        const monthlyVisitors = await prisma.trafficLog.groupBy({
            by: ['ipHash'],
            where: {
                createdAt: { gte: last30d }
            }
        });

        // 4. Chart Data (Last 7 Days)
        // We need counts per day. 
        // Prisma doesn't do "GROUP BY DATE(createdAt)" easily in cross-db way without raw query.
        // For lightness, we'll fetch headers for last 7 days and process in JS (assuming reasonable traffic).
        // If traffic is huge, use raw SQL. For now, fetch distinct IP+Date pairs is tough.
        // Let's iterate last 7 days and separate queries or use raw query.
        // Raw query is best for "By Date".

        // PostgreSQL specific raw query for daily uniques
        // "SELECT DATE(createdAt) as date, COUNT(DISTINCT ipHash) as count FROM TrafficLog WHERE ..."

        const chartData = await prisma.$queryRaw`
            SELECT 
                DATE("createdAt") as date, 
                COUNT(DISTINCT "ipHash") as count 
            FROM "TrafficLog" 
            WHERE "createdAt" >= ${last7d} 
            GROUP BY DATE("createdAt") 
            ORDER BY DATE("createdAt") ASC
        `;

        // Format chart data for frontend (handling BigInt from count if needed)
        // Prisma Raw returns BigInt for count usually
        const formattedChart = chartData.map(d => ({
            date: d.date.toISOString().split('T')[0],
            count: Number(d.count)
        }));

        res.json({
            daily: dailyVisitors.length,
            weekly: weeklyVisitors.length,
            monthly: monthlyVisitors.length,
            chart: formattedChart
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
};

module.exports = {
    logVisit,
    getTrafficStats
};
