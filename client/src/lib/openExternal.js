import { Browser } from "@capacitor/browser";

export async function openExternal(url) {
  await Browser.open({
    url,
  });
}
