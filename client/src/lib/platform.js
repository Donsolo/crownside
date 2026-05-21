import { Capacitor } from "@capacitor/core";

export const isNativeMobile = Capacitor.isNativePlatform();

export const isWeb = !isNativeMobile;

export const isAndroid =
  isNativeMobile &&
  Capacitor.getPlatform() === "android";

export const isIOS =
  isNativeMobile &&
  Capacitor.getPlatform() === "ios";
