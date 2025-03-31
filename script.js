// -- driver logic --

let mode = "bpm"; // bpm or free
let running = false;
let runningID;

const history = [];
let currTimeUnitStart = 0;

let start = () => {
    if(running) return;

    running = true;
    runningID = setInterval(() => {
        if(mode == "bpm") {
            history.push(isPressed());
        } else if(isPressed() || history[history.length - 1]) {
            history.push(isPressed());
        }

        updateSliderBar();
        updateTextBoxes();
    }, getTimeunitSecs() * 1000)
}
let stop = () => {
    if(!running) return;

    running = false;
    clearInterval(runningID);
}

// -- beginner mode logic

document.getElementById("beginner-mode").onclick = (event) => {
    let target = event.currentTarget;
    let on = target.getAttribute("on");

    on = (on == "false") ? "true" : "false"; // invert it

    if(on == "true") mode = "beginner";
    else mode = "bpm";

    target.setAttribute("on", on);
}
document.getElementById("next-letter").onclick = () => setTrailingBreaks(3);
document.getElementById("next-word").onclick = () => setTrailingBreaks(7);

let getTrailingNumber = (offset) => {
    offset = (offset == undefined) ? 0 : offset;
    let start = history.length - 1 - offset
    
    let trailingPresent = 0;
    let value = history[start];

    for(let i = start; i >= 0; i--) {
        if(history[i] != value) break;
        trailingPresent++;
    }
    return trailingPresent;
}
let getTrailingBreaks = (offset) => {
    if(history[history.length - 1 - offset] == true) return 0;
    return getTrailingNumber(offset);
}
let getTrailingFilled = (offset) => {
    if(history[history.length - 1 - offset] == false) return 0;
    return getTrailingNumber(offset);
}

let setTrailingBreaks = (numTrailing) => {
    let numNeeded = numTrailing - getTrailingBreaks();

    if(numNeeded < 0) {
        for(let i = 0; i < Math.abs(numNeeded); i++) {
            history.pop();
        }
    }

    for(let i = 0; i < numNeeded; i++) {
        history.push(false)
    }
}
let backspace = () => {
    let numBreaks = 0;
    setTrailingBreaks(0);
    let i;
    for(i = history.length - 1; i >= 0; i--) {
        if(history[i]) {
            numBreaks = 0;
            continue;
        }
        numBreaks++;
        if(numBreaks == 3) break;
    }

    if(i != -1) history.splice(i + 3); // + 1 to not include the breaks
    else history.splice(0);

    updateSliderBar();
    updateTextBoxes();
}

// -- bpm mode logic --

document.getElementById("bpm-input").addEventListener("input", (element) => { 
    stop();
    let target = element.currentTarget;
    
    let val = parseInt(target.value);

    let max = parseInt(target.getAttribute("max"))
    let min = parseInt(target.getAttribute("min"))

    val = Math.max(min, Math.min(val, max));
    target.value = val;
})

let getBPM = () => {
    if(document.getElementById("bpm-input").value == "") return 1;
    return parseInt(document.getElementById("bpm-input").value);
}
let getTimeunitSecs = () => {
    return 60 / getBPM();
}

// -- isPressed() logic --

let pressSources = new Set();

let addPress = (event) => {
    start(); // start up the slider if not already started
    if(event instanceof KeyboardEvent) {
        pressSources.add(event.code);
    } else {
        pressSources.add("mousePress");
    }
    updateCurrentSliderItem();
}
let removePress = (event) => {
    if(event instanceof KeyboardEvent) {
        pressSources.delete(event.code);
    } else {
        pressSources.delete("mousePress");
    }
    updateCurrentSliderItem();
}
let isPressed = () => {
    return pressSources.size > 0
}

document.getElementById("tap-here").addEventListener("mousedown", addPress);
document.getElementById("tap-here").addEventListener("mouseup", removePress);
document.addEventListener("keydown", addPress)
document.addEventListener("keyup", removePress)



// -- Slider bar logic --

let sliderBarItems = Array.from(document.getElementById("slider-bar").children);
sliderBarItems.sort((a, b) => {
    if(a.getAttribute("slider-num") == b.getAttribute("slider-num")) return 0;
    if(a.getAttribute("slider-num") > b.getAttribute("slider-num")) return 1;
    return -1;
});
sliderBarItems.splice(0, 1);

let updateSliderBar = () => {
    sliderBarItems.forEach((item) => {
        item.setAttribute("filled", "false");
        item.setAttribute("warning", "false");
    })
    for(let i = 0; i < sliderBarItems.length; i++) {
        if(history.length < i) return;
        let historyItem = history[history.length - 1 - i];
        sliderBarItems[i].setAttribute("filled", historyItem);
        
        console.log(getTrailingNumber(i))
        if(historyItem && getTrailingFilled(i) > 3 || (historyItem && getTrailingFilled(i) == 2 && i != 0) || !historyItem && getTrailingBreaks(i) > 7) 
            sliderBarItems[i].setAttribute("warning", true);
    }
}

let updateCurrentSliderItem = () => {
    document.getElementById("slider-bar-curr").setAttribute("filled", isPressed())
}



// -- textbox logic --

let consecutiveItemsArray = (arr) => {
    // chatGPT wrote this bc I was too lazy
    if (arr.length === 0) return [];
  
    const result = [];
    let currentCount = 1;
    let currentValue = arr[0];
  
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === currentValue) {
            currentCount++;
        } else {
            result.push(currentCount);
            currentValue = arr[i];
            currentCount = 1;
        }
    }
    result.push(currentCount);
  
    return result;
}

/**
 * @param {Array} arr of boolean values (true = pressed, false = not pressed)
 * @returns {String} String morse code representation
 */
let asMorseCode = (arr) => {
    if(arr.length == 0) return "";

    let currValue = arr[0];
    const consecutiveArray = consecutiveItemsArray(arr);

    let result = "";
    consecutiveArray.forEach(duration => {
        if(currValue == false) {
            if(duration >= 7) result += " / ";
            else if(duration >= 3) result += " ";
        } else {
            if(duration >= 3) result += "-";
            else result += ".";
        }

        currValue = !currValue;
    });

    return result;
}

let morseCodeToEnglishRef = {
    ".-": "a",   "-...": "b",  "-.-.": "c",  "-..": "d",   ".": "e",   
    "..-.": "f", "--.":  "g",  "....": "h",  "..": "i",    ".---": "j", 
    "-.-": "k",  ".-..": "l",  "--": "m",    "-.": "n",    "---": "o",  
    ".--.": "p", "--.-": "q",  ".-.": "r",   "...": "s",   "-": "t",    
    "..-": "u",  "...-": "v",  ".--": "w",   "-..-": "x",  "-.--": "y", 
    "--..": "z",

    "-----": "0", ".----": "1", "..---": "2", "...--": "3", "....-": "4",
    ".....": "5", "-....": "6", "--...": "7", "---..": "8", "----.": "9",

    ".-.-.-": ".", "--..--": ",", "..--..": "?",  "-.-.--": "!", "-....-": "-",
    ".----.": "'", "-..-.": "/",  ".-..-.": "\"", ".--.-.": "@", "-...-": "=",
    "-.-.-.": ";", "---...": ":", "-.-.-": "+",   "-..-.-": "$", ".-.-.": "&",
    ".-..-.": "(", "-.--.": ")",  "---.-": "*",   ".-.-.-": "."
}

/**
 * @param {String} morseCode 
 * @returns {String} the english translation
 */
let morseCodeToEnglish = (morseCode) => {
    let english = "";
    morseCode.split(" / ").forEach(word => {
        word.split(" ").forEach(letter => {
            if(letter != "") {
                let str = morseCodeToEnglishRef[letter];
                if(str != undefined) english += str;
                else english += "[" + letter + "]";    
            }
        })
        english += " ";
    });

    return english;
}

let updateTextBoxes = () => {
    let englishTextContent = document.getElementById("english-text-box").getElementsByClassName("text-content")[0];
    let morseCodeTextContent = document.getElementById("morse-code-text-box").getElementsByClassName("text-content")[0];

    let morseCode = asMorseCode(history);
    let english = morseCodeToEnglish(morseCode);

    englishTextContent.textContent = english;
    morseCodeTextContent.textContent = morseCode;
}

// copy on click
let copyTextBoxContent = (event) => {
    let containerDiv = event.currentTarget;
    let contentParagraph = containerDiv.getElementsByClassName("text-content")[0];
    navigator.clipboard.writeText(contentParagraph.textContent);
}

document.getElementById("english-text-box").onclick = copyTextBoxContent;
document.getElementById("morse-code-text-box").onclick = copyTextBoxContent;