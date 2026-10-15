import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function relative(date?: string | null) {
  if (!date) return "";
  const d = new Date(date);
  // Guard against small clock differences between the database and the browser.
  if (d.getTime() > Date.now()) return "à l'instant";
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}
