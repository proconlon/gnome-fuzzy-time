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
    let rawHour = now.getHours(); // 0–23 format
    let minute = now.getMinutes();

    // Convert to 12-hour numeric values
    // For 0 or 12, we get 12
    let currentHour12 = rawHour % 12 || 12;
    let nextHour12 = (rawHour + 1) % 12 || 12;

    const numbersToWords = {
        1: "one", 2: "two", 3: "three", 4: "four", 5: "five",
        6: "six", 7: "seven", 8: "eight", 9: "nine", 10: "ten",
        11: "eleven", 12: "twelve"
    };

    let hourWord = numbersToWords[currentHour12];
    let nextHourWord = numbersToWords[nextHour12];

    let fuzzyTime = "";

    // For the exact hour boundary (0-2 minutes)
    if (minute < 3) {
        if (hourWord === "twelve") {
            // If current raw hour is 0 (midnight) or 12 (noon), substitute.
            if (rawHour === 0) {
                fuzzyTime = "midnight";
            } else if (rawHour === 12) {
                fuzzyTime = "noon";
            } else {
                // Fallback (should not happen)
                fuzzyTime = `${hourWord} o'clock`;
            }
        } else {
            fuzzyTime = `${hourWord} o'clock`;
        }
    } else if (minute < 8) {
        fuzzyTime = `five past ${hourWord}`;
    } else if (minute < 13) {
        fuzzyTime = `ten past ${hourWord}`;
    } else if (minute < 18) {
        fuzzyTime = `quarter past ${hourWord}`;
    } else if (minute < 23) {
        fuzzyTime = `twenty past ${hourWord}`;
    } else if (minute < 28) {
        fuzzyTime = `twenty-five past ${hourWord}`;
    } else if (minute < 33) {
        fuzzyTime = `half past ${hourWord}`;
    } else if (minute < 38) {
        fuzzyTime = `twenty-five to ${nextHourWord}`;
    } else if (minute < 43) {
        fuzzyTime = `twenty to ${nextHourWord}`;
    } else if (minute < 48) {
        fuzzyTime = `quarter to ${nextHourWord}`;
    } else if (minute < 53) {
        fuzzyTime = `ten to ${nextHourWord}`;
    } else if (minute < 58) {
        fuzzyTime = `five to ${nextHourWord}`;
    } else {
        // For times 58–59, we use the next hour with "o'clock".
        if (nextHourWord === "twelve") {
            let nextRawHour = (rawHour + 1) % 24;
            if (nextRawHour === 0) {
                fuzzyTime = "midnight";
            } else if (nextRawHour === 12) {
                fuzzyTime = "noon";
            } else {
                fuzzyTime = `${nextHourWord} o'clock`;
            }
        } else {
            fuzzyTime = `${nextHourWord} o'clock`;
        }
    }

    return fuzzyTime;
}