import GLib from "gi://GLib";
import St from "gi://St";
import Clutter from "gi://Clutter";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as main from "resource:///org/gnome/shell/ui/main.js";

let originalClockDisplay;
let formatClockDisplay;
let timeoutID = 0;

export default class PanelDateFormatExtension extends Extension {
  /**
   * Enable, called when extension is enabled or when screen is unlocked.
   */
  enable() {
    originalClockDisplay = main.panel.statusArea.dateMenu._clockDisplay;
    formatClockDisplay = new St.Label({ style_class: "clock" });
    formatClockDisplay.clutter_text.y_align = Clutter.ActorAlign.CENTER;
    formatClockDisplay.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;

    originalClockDisplay.hide();
    originalClockDisplay
      .get_parent()
      .insert_child_below(formatClockDisplay, originalClockDisplay);
    timeoutID = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, tick);
  }

  /**
   * Disable, called when extension is disabled or when screen is locked.
   */
  disable() {
    GLib.Source.remove(timeoutID);
    timeoutID = 0;
    originalClockDisplay.get_parent().remove_child(formatClockDisplay);
    originalClockDisplay.show();
    formatClockDisplay = null;
  }
}

/**
 * It runs every time we need to update clock.
 * @return {boolean} Always returns true to loop.
 */
function tick() {
    formatClockDisplay.set_text(getFuzzyTime());
    return true;
}

/**
 * Converts current time to fuzzy time. Possible too fuzzy (who says 25 past? --
 * but if i didn't have it, you would have a gap between 20 and half past so it's going to stay) 
 * @return {string} Fuzzy time string
 */
function getFuzzyTime() {
    let now = new Date();
    let hour = now.getHours();
    let minute = now.getMinutes();

    // Convert to 12-hour format
    let nextHour = (hour + 1) % 12 || 12;
    hour = hour % 12 || 12;

    // Special cases for noon/midnight 
    if (minute < 3) {
        if (now.getHours() === 0) {
            return "midnight";
        } else if (now.getHours() === 12) {
            return "noon";
        }
    }

    let fuzzyTime = "";

    if (minute < 3) {
        fuzzyTime = `${hour} o'clock`;
    } else if (minute < 8) {
        fuzzyTime = `five past ${hour}`;
    } else if (minute < 13) {
        fuzzyTime = `ten past ${hour}`;
    } else if (minute < 18) {
        fuzzyTime = `quarter past ${hour}`;
    } else if (minute < 23) {
        fuzzyTime = `twenty past ${hour}`;
    } else if (minute < 28) {
        fuzzyTime = `twenty-five past ${hour}`;
    } else if (minute < 33) {
        fuzzyTime = `half past ${hour}`;
    } else if (minute < 38) {
        fuzzyTime = `twenty-five to ${nextHour}`;
    } else if (minute < 43) {
        fuzzyTime = `twenty to ${nextHour}`;
    } else if (minute < 48) {
        fuzzyTime = `quarter to ${nextHour}`;
    } else if (minute < 53) {
        fuzzyTime = `ten to ${nextHour}`;
    } else if (minute < 58) {
        fuzzyTime = `five to ${nextHour}`;
    } else {
        fuzzyTime = `${nextHour} o'clock`;
    }

    return fuzzyTime;
}
