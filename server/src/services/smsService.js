const twilio = require('twilio');

// Initialize Twilio Client ONLY if enabled
// Safety: We do not want to crash if credentials are missing when disabled.
const isSmsEnabled = process.env.SMS_ENABLED === 'true';

let client = null;

if (isSmsEnabled) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
        console.error('[SMS SERVICE] SMS_ENABLED is true, but credentials are missing. SMS will fail.');
    } else {
        client = twilio(accountSid, authToken);
        console.log('[SMS SERVICE] Twilio Client Initialized');
    }
} else {
    console.log('[SMS SERVICE] Disabled (SMS_ENABLED != true)');
}

/**
 * Internal helper to safely send or log SMS intent.
 */
const sendSms = async (to, body, type) => {
    if (!to) {
        console.warn(`[SMS SERVICE] Skipped ${type}: No phone number provided.`);
        return;
    }

    if (!isSmsEnabled) {
        console.log(`[SMS DISABLED] Would have sent ${type} to ${to}: "${body}"`);
        return; // EXIT - SAFETY
    }

    if (!client) {
        console.error(`[SMS SERVICE] Failed to send ${type}: Client not initialized.`);
        return;
    }

    try {
        const message = await client.messages.create({
            body: body,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`[SMS SERVICE] Sent ${type} to ${to}. SID: ${message.sid}`);
        return message;
    } catch (error) {
        // NEVER CRASH THE APP because of an SMS failure
        console.error(`[SMS SERVICE] Error sending ${type} to ${to}:`, error.message);
        // We absorb the error so booking flow continues
    }
};

/**
 * Send Confirmation to Client
 * Logic: "Your Crownside appointment is confirmed for {date} at {time} with {stylist}. We’ll remind you before your visit."
 */
const sendAppointmentConfirmationClient = async ({ phoneNumber, appointmentDate, stylistName }) => {
    // Format Date/Time safely
    const dateObj = new Date(appointmentDate);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const message = `Your Crownside appointment is confirmed for ${dateStr} at ${timeStr} with ${stylistName}. We'll remind you before your visit.`;

    await sendSms(phoneNumber, message, 'CLIENT_CONFIRMATION');
};

/**
 * Send Confirmation to Stylist
 * Logic: "New Crownside booking confirmed: {client} on {date} at {time} for {service}."
 */
const sendAppointmentConfirmationStylist = async ({ phoneNumber, appointmentDate, clientName, serviceName }) => {
    const dateObj = new Date(appointmentDate);
    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const message = `New Crownside booking confirmed: ${clientName} on ${dateStr} at ${timeStr} for ${serviceName}.`;

    await sendSms(phoneNumber, message, 'STYLIST_NOTIFICATION');
};

/**
 * Send Reminder to Client
 * Logic: "Reminder: Your Crownside appointment with {stylist} is coming up at {time}. See you soon."
 */
const sendAppointmentReminderClient = async ({ phoneNumber, appointmentDate, stylistName }) => {
    const dateObj = new Date(appointmentDate);
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const message = `Reminder: Your Crownside appointment with ${stylistName} is coming up at ${timeStr}. See you soon.`;

    await sendSms(phoneNumber, message, 'CLIENT_REMINDER');
};

/**
 * Send Reminder to Stylist
 * Logic: "Reminder: You have an upcoming Crownside appointment with {client} at {time}."
 */
const sendAppointmentReminderStylist = async ({ phoneNumber, appointmentDate, clientName }) => {
    const dateObj = new Date(appointmentDate);
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const message = `Reminder: You have an upcoming Crownside appointment with ${clientName} at ${timeStr}.`;

    await sendSms(phoneNumber, message, 'STYLIST_REMINDER');
};

module.exports = {
    sendAppointmentConfirmationClient,
    sendAppointmentConfirmationStylist,
    sendAppointmentReminderClient,
    sendAppointmentReminderStylist
};
