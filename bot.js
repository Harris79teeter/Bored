const { Telegraf } = require("telegraf");
const fs = require("fs-extra");
const path = require("path");
const JsConfuser = require("js-confuser");
const config = require("./config");
const axios = require("axios");
const { webcrack } = require("webcrack");
const crypto = require("crypto");
const { Client } = require("ssh2");

const bot = new Telegraf(config.BOT_TOKEN);
const userData = {};

const log = (message, error = null) => {
  const timestamp = new Date().toISOString().replace("T", " ").replace("Z", "");
  const prefix = `\x1b[36m[ 𝕴 𝖆𝖒 𝖍𝖎𝖒 obf bot ]\x1b[0m`;
  const timeStyle = `\x1b[33m[${timestamp}]\x1b[0m`;
  const msgStyle = `\x1b[32m${message}\x1b[0m`;
  console.log(`${prefix} ${timeStyle} ${msgStyle}`);
  if (error) {
    const errorStyle = `\x1b[31m✖ Error: ${error.message || error}\x1b[0m`;
    console.error(`${prefix} ${timeStyle} ${errorStyle}`);
    if (error.stack) console.error(`\x1b[90m${error.stack}\x1b[0m`);
  }
};


const CF_API_TOKEN = "CQ4aK4fwUmH3RbM52vI5myFv-IxTIFTsguvRnGpi"; 
const CF_ZONE_ID = "2d45a678eab00687ebcb1111beffaf2b"; 



const USERS_FILE = "./users.json";


function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return new Set(JSON.parse(data));
    }
    return new Set();
  } catch (error) {
    log("Failed to load users from JSON", error);
    return new Set();
  }
}


function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify([...users], null, 2));
  } catch (error) {
    log("Failed to save users to JSON", error);
  }
}


let users = loadUsers();


async function checkChannelMembership(ctx) {
  const channelId = ""; 
  try {
    const chatMember = await ctx.telegram.getChatMember(channelId, ctx.from.id);
    return ["member", "administrator", "creator"].includes(chatMember.status);
  } catch (error) {
    log("Failed to check channel membership", error);
    return false;
  }
}


const obfuscateTimeLocked = async (fileContent, days) => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));
  const expiryTimestamp = expiryDate.getTime();
  try {
    const obfuscated = await JsConfuser.obfuscate(
      `(function(){const expiry=${expiryTimestamp};if(new Date().getTime()>expiry){throw new Error('Script has expired after ${days} days');}${fileContent}})();`,
      {
        target: "node",
        compact: true,
        renameVariables: true,
        renameGlobals: true,
        identifierGenerator: "randomized",
        stringCompression: true,
        stringConcealing: true,
        stringEncoding: true,
        controlFlowFlattening: 0.75,
        flatten: true,
        shuffle: true,
        rgf: false,
        opaquePredicates: {
          count: 6,
          complexity: 4,
        },
        dispatcher: true,
        globalConcealing: true,
        lock: {
          selfDefending: true,
          antiDebug: (code) =>
            `if(typeof debugger!=='undefined'||process.env.NODE_ENV==='debug')throw new Error('Debugging disabled');${code}`,
          integrity: true,
          tamperProtection: (code) =>
            `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`,
        },
        duplicateLiteralsRemoval: true,
      }
    );
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    return obfuscatedCode;
  } catch (error) {
    throw new Error(`Gagal obfuscate: ${error.message}`);
  }
};


const obfuscateQuantum = async (fileContent) => {
 
  const generateTimeBasedIdentifier = () => {
    const timeStamp = new Date().getTime().toString().slice(-5);
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$#@&*";
    let identifier = "qV_";
    for (let i = 0; i < 7; i++) {
      identifier +=
        chars[Math.floor((parseInt(timeStamp[i % 5]) + i * 2) % chars.length)];
    }
    return identifier;
  };

  
  const currentMilliseconds = new Date().getMilliseconds();
  const phantomCode =
    currentMilliseconds % 3 === 0
      ? `if(Math.random()>0.999)console.log('PhantomTrigger');`
      : "";

  try {
    const obfuscated = await JsConfuser.obfuscate(fileContent + phantomCode, {
      target: "node",
      compact: true,
      renameVariables: true,
      renameGlobals: true,
      identifierGenerator: generateTimeBasedIdentifier,
      stringCompression: true,
      stringConcealing: false,
      stringEncoding: true,
      controlFlowFlattening: 0.85, 
      flatten: true,
      shuffle: true,
      rgf: true,
      opaquePredicates: {
        count: 8, 
        complexity: 5,
      },
      dispatcher: true,
      globalConcealing: true,
      lock: {
        selfDefending: true,
        antiDebug: (code) =>
          `if(typeof debugger!=='undefined'||(typeof process!=='undefined'&&process.env.NODE_ENV==='debug'))throw new Error('Debugging disabled');${code}`,
        integrity: true,
        tamperProtection: (code) =>
          `if(!((function(){return eval('1+1')===2;})()))throw new Error('Tamper detected');${code}`,
      },
      duplicateLiteralsRemoval: true,
    });
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    
    const key = currentMilliseconds % 256;
    obfuscatedCode = `(function(){let k=${key};return function(c){return c.split('').map((x,i)=>String.fromCharCode(x.charCodeAt(0)^(k+(i%16)))).join('');}('${obfuscatedCode}');})()`;
    return obfuscatedCode;
  } catch (error) {
    throw new Error(`Gagal obfuscate: ${error.message}`);
  }
};

const getSiuCalcrickObfuscationConfig = () => {
  const generateSiuCalcrickName = () => {
   
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomPart = "";
    for (let i = 0; i < 6; i++) {
      
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
    return `CalceKarik和SiuSiu无与伦比的帅气${randomPart}`;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateSiuCalcrickName,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    rgf: false,
    flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getCustomObfuscationConfig = (customString) => {
  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    rgf: false,
    flatten: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    identifierGenerator: function () {
      return `${customString}` + Math.random().toString(36).substring(7);
    },
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getNebulaObfuscationConfig = () => {
  const generateNebulaName = () => {
    
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const prefix = "NX";
    let randomPart = "";
    for (let i = 0; i < 4; i++) {
      randomPart += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}${randomPart}`;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: generateNebulaName,
    stringCompression: true,
    stringConcealing: false,
    stringEncoding: true,
    stringSplitting: false,
    controlFlowFlattening: 0.75,
    flatten: true,
    shuffle: true,
    rgf: true,
    deadCode: true,
    opaquePredicates: true,
    dispatcher: true,
    globalConcealing: true,
    objectExtraction: true,
    duplicateLiteralsRemoval: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getNovaObfuscationConfig = () => {
  const generateNovaName = () => {
    return "var_" + Math.random().toString(36).substring(7);
  };

  return {
    target: "node",
    calculator: false,
    compact: true,
    controlFlowFlattening: 1,
    deadCode: 1,
    dispatcher: true,
    duplicateLiteralsRemoval: 1,
    es5: true,
    flatten: true,
    globalConcealing: true,
    hexadecimalNumbers: 1,
    identifierGenerator: generateNovaName,
    lock: {
      antiDebug: true,
      integrity: true,
      selfDefending: true,
    },
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: true,
    renameGlobals: true,
    renameVariables: true,
    shuffle: true,
    stack: true,
    stringCompression: true,
    stringConcealing: true,
  };
};

const getStrongObfuscationConfig = () => {
  return {
    target: "node",
    calculator: true,
    compact: true,
    hexadecimalNumbers: true,
    controlFlowFlattening: 0.75,
    deadCode: 0.2,
    dispatcher: true,
    duplicateLiteralsRemoval: 0.75,
    flatten: true,
    globalConcealing: true,
    identifierGenerator: "zeroWidth",
    minify: true,
    movedDeclarations: true,
    objectExtraction: true,
    opaquePredicates: 0.75,
    renameVariables: true,
    renameGlobals: true,
    stringConcealing: true,
    stringCompression: true,
    stringEncoding: true,
    stringSplitting: 0.75,
    rgf: false,
  };
};

const getArabObfuscationConfig = () => {
  const arabicChars = [
    "أ",
    "ب",
    "ت",
    "ث",
    "ج",
    "ح",
    "خ",
    "د",
    "ذ",
    "ر",
    "ز",
    "س",
    "ش",
    "ص",
    "ض",
    "ط",
    "ظ",
    "ع",
    "غ",
    "ف",
    "ق",
    "ك",
    "ل",
    "م",
    "ن",
    "ه",
    "و",
    "ي",
  ];

  const generateArabicName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) {
      name += arabicChars[Math.floor(Math.random() * arabicChars.length)];
    }
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateArabicName(),
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.95,
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getJapanxArabObfuscationConfig = () => {
  const japaneseXArabChars = [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "や",
    "ゆ",
    "よ",
    "أ",
    "ب",
    "ت",
    "ث",
    "ج",
    "ح",
    "خ",
    "د",
    "ذ",
    "ر",
    "ز",
    "س",
    "ش",
    "ص",
    "ض",
    "ط",
    "ظ",
    "ع",
    "غ",
    "ف",
    "ق",
    "ك",
    "ل",
    "م",
    "ن",
    "ه",
    "و",
    "ي",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "わ",
    "を",
    "ん",
  ];

  const generateJapaneseXArabName = () => {
    const length = Math.floor(Math.random() * 4) + 3;
    let name = "";
    for (let i = 0; i < length; i++) {
      name +=
        japaneseXArabChars[
          Math.floor(Math.random() * japaneseXArabChars.length)
        ];
    }
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateJapaneseXArabName(),
    stringCompression: true, 
    stringConcealing: true, 
    stringEncoding: true, 
    stringSplitting: true, 
    controlFlowFlattening: 0.95, 
    flatten: true, 
    shuffle: true,
    rgf: false,
    dispatcher: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};

const getJapanObfuscationConfig = () => {
  const japaneseChars = [
    "あ",
    "い",
    "う",
    "え",
    "お",
    "か",
    "き",
    "く",
    "け",
    "こ",
    "さ",
    "し",
    "す",
    "せ",
    "そ",
    "た",
    "ち",
    "つ",
    "て",
    "と",
    "な",
    "に",
    "ぬ",
    "ね",
    "の",
    "は",
    "ひ",
    "ふ",
    "へ",
    "ほ",
    "ま",
    "み",
    "む",
    "め",
    "も",
    "や",
    "ゆ",
    "よ",
    "ら",
    "り",
    "る",
    "れ",
    "ろ",
    "わ",
    "を",
    "ん",
  ];

  const generateJapaneseName = () => {
    const length = Math.floor(Math.random() * 4) + 3; 
    let name = "";
    for (let i = 0; i < length; i++) {
      name += japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
    }
    return name;
  };

  return {
    target: "node",
    compact: true,
    renameVariables: true,
    renameGlobals: true,
    identifierGenerator: () => generateJapaneseName(),
    stringEncoding: true,
    stringSplitting: true,
    controlFlowFlattening: 0.9, 
    flatten: true, 
    shuffle: true,
    duplicateLiteralsRemoval: true,
    deadCode: true,
    calculator: true,
    opaquePredicates: true,
    lock: {
      selfDefending: true,
      antiDebug: true,
      integrity: true,
      tamperProtection: true,
    },
  };
};


const createProgressBar = (percentage) => {
  const total = 10;
  const filled = Math.round((percentage / 100) * total);
  return "▰".repeat(filled) + "▱".repeat(total - filled);
};


async function updateProgress(ctx, message, percentage, status) {
  const bar = createProgressBar(percentage);
  const levelText = percentage === 100 ? "✅ Finished" : `⚙️ ${status}`;
  try {
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      message.message_id,
      null,
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ${levelText} (${percentage}%)\n` +
        ` ${bar}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS",
      { parse_mode: "Markdown" }
    );
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(800, percentage * 8))
    );
  } catch (error) {
    log("Failed to update progress", error);
  }
}

bot.start(async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);
  await ctx.telegram.sendChatAction(ctx.chat.id, "typing");

  setTimeout(async () => {
    await ctx.replyWithPhoto("https://huggingface.co/datasets/Trigger82/Sukuna/resolve/main/uox854.jpeg", {
      caption: `
✦ ─────────── ✦
   ENCRYPT MENU  
✦ ─────────── ✦

📂 Available Methods:
・Encrypt JavaScript
・Encrypt Hard
・Encrypt Path
・Encrypt Path + Anti Webcrack
・Encrypt Invisible Hard

📜 Commands:
/zenc  → Invisible Character
/enc   → Set Expired
/enc2  → Custom Name
/enc3  → Chinese Obfuscate
/enc4  → Arab Obfuscate
/enc5  → Siu Obfuscate
/enchard → Best obfuscation

📎 Usage Example:
/enc2 変𝕴 𝖆𝖒 𝖍𝖎𝖒日𝕴 𝖆𝖒 𝖍𝖎𝖒変
✦ ─────────── ✦      

`,
      parse_mode: "Markdown",
      reply_markup: {},
    });
  }, 100);
});

bot.command("eval", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/eval [level]`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const args = ctx.message.text.split(" ");
  const encryptionLevel = ["low", "medium", "high"].includes(args[1])
    ? args[1]
    : "high";
  const encryptedPath = path.join(
    __dirname,
    `eval-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Starting Evaluation (${encryptionLevel}) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for evaluation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    const fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    let evalResult;
    try {
      await updateProgress(ctx, progressMessage, 30, "Evaluating Original Code");
      evalResult = eval(fileContent);
      if (typeof evalResult === "function") {
        evalResult = "Function detected (cannot display full output)";
      } else if (evalResult === undefined) {
        evalResult = "No return value";
      }
    } catch (evalError) {
      evalResult = `Evaluation error: ${evalError.message}`;
    }

    log(`Validating Code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 40, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid code: ${syntaxError.message}`);
    }

    log(`Encrypting and evaluating file with level: ${encryptionLevel}`);
    await updateProgress(
      ctx,
      progressMessage,
      50,
      "Initializing Hardened Encryption"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getObfuscationConfig(encryptionLevel)
    );
    await updateProgress(ctx, progressMessage, 70, "Code Transformation");
    await fs.writeFile(encryptedPath, obfuscated.code);
    await updateProgress(ctx, progressMessage, 90, "Encryption Finalization");

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscated.code);
    } catch (postObfuscationError) {
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    log(`Sending encrypted file and evaluation result: ${file.file_name}`);
    await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot- Evaluation Result\n" +
        "```\n" +
        `✨ *Original Code Result:* \n\`\`\`javascript\n${evalResult}\n\`\`\`\n` +
        `_Level: ${encryptionLevel} | Powered by 𝕴 𝖆𝖒 𝖍𝖎𝖒`
    );
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `eval-encrypted-${file.file_name}` },
      {
        caption: "✅ *Encrypted file ready!*\n_ENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      `Evaluation & Encryption (${encryptionLevel})`
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during encryption/evaluation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});


bot.command("enc3", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(`
╭━━━「 ❌ ERROR 」━━━⬣
│ An error occurred while
│processing the file!
╰━━━━━━━━━━━━━━━━⬣`);
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown(`
╭━━━「 ❌ ERROR 」━━━⬣
│ File must have the extension .js!
╰━━━━━━━━━━━━━━━━⬣`);
  }

  const encryptedPath = path.join(
    __dirname,
    `china-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Memulai (Hardened Mandarin) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Mandarin obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating Code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid code: ${syntaxError.message}`);
    }

    log(`Encrypting file with reinforced Mandarin style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Hardened Mandarin Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getMandarinObfuscationConfig()
    );
    await updateProgress(ctx, progressMessage, 60, "Code Transformation");
    await fs.writeFile(encryptedPath, obfuscated.code);
    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscated.code);
    } catch (postObfuscationError) {
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    log(`Sending Mandarin-style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `china-encrypted-${file.file_name}` },
      {
        caption:
          "✅ *Encrypted file (Hardened Mandarin) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Hardened Mandarin Obfuscation Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Mandarin obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("broadcast", async (ctx) => {
  
  users.add(ctx.from.id);
  saveUsers(users);

  
  if (ctx.from.id !== config.ADMIN_ID) {
    return ctx.replyWithMarkdown(
      "❌ *Access denied:* Only admins can use this command!"
    );
  }

  const message = ctx.message.text.split(" ").slice(1).join(" ");
  if (!message) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Write a message for broadcast, example: `/broadcast Hello everyone!`"
    );
  }

  log(`Sending broadcast: ${message}`);
  let successCount = 0;
  let failCount = 0;

  for (const userId of users) {
    try {
      await bot.telegram.sendMessage(userId, message, {
        parse_mode: "Markdown",
      });
      successCount++;
    } catch (error) {
      log(`Failed to send to ${userId}`, error);
      failCount++;
    }
  }

  await ctx.replyWithMarkdown(
    `📢 *Broadcast Finished:*\n` +
      `- Successfully sent to: ${successCount} users` +
      `- Failed to send to: ${failCount} users`
  );
});


bot.command("enc4", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown("❌ *Error:* Reply with a .js file using `/enc4`!");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `arab-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Starting (Hardened Arab) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Arab obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating Code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid code: ${syntaxError.message}`);
    }

    log(`Encrypting file with reinforced Arab style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Hardened Arab Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getArabObfuscationConfig()
    );
    await updateProgress(ctx, progressMessage, 60, "Code Transformation");
    await fs.writeFile(encryptedPath, obfuscated.code);
    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscated.code);
    } catch (postObfuscationError) {
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    log(`Sending Arab-style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `arab-encrypted-${file.file_name}` },
      {
        caption:
          "✅ *Encrypted file (Hardened Arab) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Hardened Arab Obfuscation Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Arab obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});


bot.command("japan", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown("❌ *Error:* Reply with a .js file using `/japan`!");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `japan-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Starting (Hardened Japan) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Japan obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating Code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid code: ${syntaxError.message}`);
    }

    log(`Encrypting file with reinforced Japan style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Hardened Japan Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getJapanObfuscationConfig()
    );
    await updateProgress(ctx, progressMessage, 60, "Code Transformation");
    await fs.writeFile(encryptedPath, obfuscated.code);
    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscated.code);
    } catch (postObfuscationError) {
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    log(`Sending Japan-style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `japan-encrypted-${file.file_name}` },
      {
        caption:
          "✅ *Encrypted file (Hardened Japan) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Hardened Japan Obfuscation Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Japan obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});


bot.command("deobfuscate", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with an obfuscated .js file using `/deobfuscate`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const deobfuscatedPath = path.join(
    __dirname,
    `deobfuscated-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Starting Deobfuscation (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "DEOBFUSCATION IN PROCESS"
    );

   
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for deobfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    
    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Initial Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    
    log(`Starting deobfuscation with webcrack: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 40, "Starting Deobfuscation");
    const result = await webcrack(fileContent);
    let deobfuscatedCode = result.code;

    
    let bundleInfo = "";
    if (result.bundle) {
      bundleInfo = "// Detected as bundled code (e.g., Webpack/Browserify)\n";
      log(`Code detected as a bundle: ${file.file_name}`);
    }

    
    if (
      !deobfuscatedCode ||
      typeof deobfuscatedCode !== "string" ||
      deobfuscatedCode.trim() === fileContent.trim()
    ) {
      log(
        `Webcrack cannot decode further or result is not a string: ${file.file_name}`
      );
      deobfuscatedCode = `${bundleInfo}// Webcrack cannot fully decode or result is invalid\n${fileContent}`;
    }

   
    log(`Validating deobfuscated code result: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 60, "Validating Output Code");
    let isValid = true;
    try {
      new Function(deobfuscatedCode);
      log(`Valid output code: ${deobfuscatedCode.substring(0, 50)}...`);
    } catch (syntaxError) {
      log(`Invalid output code: ${syntaxError.message}`);
      deobfuscatedCode = `${bundleInfo}// Validation error: ${syntaxError.message}\n${deobfuscatedCode}`;
      isValid = false;
    }

   
    await updateProgress(ctx, progressMessage, 80, "Saving Result");
    await fs.writeFile(deobfuscatedPath, deobfuscatedCode);

    
    log(`Sending deobfuscated result file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: deobfuscatedPath, filename: `deobfuscated-${file.file_name}` },
      {
        caption: `✅ *File successfully deobfuscated!${
          isValid ? "" : " (Pay attention to the error message in the file)"
        }*\nDEOBFUSCATION SUCCESSFUL 🕊`,
        parse_mode: "Markdown",
      }
    );
    await updateProgress(ctx, progressMessage, 100, "Deobfuscation Finished");

    
    if (await fs.pathExists(deobfuscatedPath)) {
      await fs.unlink(deobfuscatedPath);
      log(`Temporary file deleted: ${deobfuscatedPath}`);
    }
  } catch (error) {
    log("Error during deobfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with a valid Javascript file!_`
    );
    if (await fs.pathExists(deobfuscatedPath)) {
      await fs.unlink(deobfuscatedPath);
      log(`Temporary file deleted after error: ${deobfuscatedPath}`);
    }
  }
});


bot.command("zenc", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown("❌ *Error:* Reply with a .js file using `/zenc`!");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `invisible-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Memulai (InvisiBle) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Strong obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Strong style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Hardened Invisible Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getStrongObfuscationConfig()
    );
    let obfuscatedCode = obfuscated.code || obfuscated; 
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    await updateProgress(ctx, progressMessage, 60, "Code Transformation");

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Mengirim file terenkripsi gaya Invisible: ${file.file_name}`);
    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `Invisible-encrypted-${file.file_name}`,
      },
      {
        caption: "✅ *Encrypted file (Invisible) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Hardened Invisible Obfuscation Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Invisible obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("xx", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  
  const args = ctx.message.text.split(" ");
  if (args.length < 2 || !args[1]) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Use format /enc <name> with a custom name!"
    );
  }
  const customName = args[1].replace(/[^a-zA-Z0-9_]/g, ""); 
  if (!customName) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Custom name must contain letters, numbers, or underscores!"
    );
  }

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/enc <nama>`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `custom-${customName}-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        ` ⚙️ Memulai (Hardened Custom: ${customName}) (1%)\n` +
        ` ${createProgressBar(1)}\n` +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Custom obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with reinforced Custom (${customName}) style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Hardened Custom Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getCustomObfuscationConfig(customName)
    );
    log(
      `Obfuscation result (first 50 chars): ${obfuscated.code.substring(
        0,
        50
      )}...`
    );
    await updateProgress(ctx, progressMessage, 60, "Code Transformation");

    log(`Validating obfuscated code result: ${file.file_name}`);
    try {
      new Function(obfuscated.code);
    } catch (postObfuscationError) {
      log(
        `Invalid obfuscated code result: ${postObfuscationError.message}`
      );
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await fs.writeFile(encryptedPath, obfuscated.code);
    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");

    log(`Sending Hardened encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `custom-${customName}-encrypted-${file.file_name}`,
      },
      {
        caption: `✅ *Encrypted file (Hardened Custom: ${customName}) ready!*\nENCRYPTION SUCCESSFUL 🕊`,
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      `Hardened Custom (${customName}) Obfuscation Finished`
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Custom obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("quantum", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/quantum`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `quantum-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (Quantum Vortex Encryption) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Quantum Vortex Encryption: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Quantum Vortex Encryption`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Quantum Vortex Encryption"
    );
    const obfuscatedCode = await obfuscateQuantum(fileContent);
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    log(
      `File size after obfuscation: ${Buffer.byteLength(
        obfuscatedCode,
        "utf-8"
      )} bytes`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending quantum encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `quantum-encrypted-${file.file_name}`,
      },
      {
        caption:
          "✅ *Encrypted file (Quantum Vortex Encryption) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Quantum Vortex Encryption Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Quantum obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});


bot.command("var", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown("❌ *Error:* Reply with a .js file using `/var`!");
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(__dirname, `var-encrypted-${file.file_name}`);

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (Var) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Var obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Var style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Var Dynamic Obfuscation"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getNovaObfuscationConfig()
    );
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending Var-style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `Var-encrypted-${file.file_name}` },
      {
        caption: "✅ *Encrypted file (Var) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(ctx, progressMessage, 100, "Var Obfuscation Finished");

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Nova obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("nebula", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/nebula`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `nebula-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (Nebula Polymorphic Storm) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Nebula obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Nebula style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Nebula Polymorphic Storm"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getNebulaObfuscationConfig()
    );
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    log(
      `File size after obfuscation: ${Buffer.byteLength(
        obfuscatedCode,
        "utf-8"
      )} bytes`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending Nebula-style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      { source: encryptedPath, filename: `nebula-encrypted-${file.file_name}` },
      {
        caption:
          "✅ *Encrypted file (Nebula Polymorphic Storm) ready!*\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Nebula Polymorphic Storm Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Nebula obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code! _`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("enchard", async (ctx) => {
  try {
    
    
    // Check if replying to a message
    if (!ctx.message.reply_to_message) {
      return ctx.replyWithMarkdown(
        "⚠️ *Please reply to a JavaScript (.js) file.*",
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    
    const quotedMessage = ctx.message.reply_to_message;
    
    // Check if it's a document
    if (!quotedMessage.document) {
      return ctx.replyWithMarkdown(
        "📄 *Please reply to a JavaScript (.js) file.*",
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    
    const fileName = quotedMessage.document.file_name;
    
    // Check if it's a .js file
    if (!fileName || !fileName.toLowerCase().endsWith(".js")) {
      return ctx.replyWithMarkdown(
        "🔧 *Only JavaScript (.js) files are supported.*",
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    
    // Get file information
    const fileId = quotedMessage.document.file_id;
    
    // Send initial message
    const processingMsg = await ctx.replyWithMarkdown(
      "⏳ *Please wait...*\nEncrypting your file...",
      { reply_to_message_id: ctx.message.message_id }
    );
    
    try {
      // Get file link
      const fileLink = await ctx.telegram.getFileLink(fileId);
      
      // Download file
      const response = await axios({
        method: "GET",
        url: fileLink,
        responseType: "arraybuffer"
      });
      
      // Create temp file path
      const tempFileName = `temp_${Date.now()}_${fileName}`;
      const encryptedFileName = `enchard_${Date.now()}_${fileName}`;
      const tempFilePath = path.join(__dirname, tempFileName);
      const encryptedFilePath = path.join(__dirname, encryptedFileName);
      
      // Save temporary file
      await fs.writeFile(tempFilePath, response.data);
      
      // Read file content
      const fileContent = await fs.readFile(tempFilePath, "utf8");
      
      // Create progress message for encryption
      const progressMessage = await ctx.replyWithMarkdown(
        "```css\n" +
        "🔒 ENCHARD ENCRYPTION\n" +
        " ⚙️ Starting High-Level Encryption (1%)\n" +
        " " + createProgressBar(1) + "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS",
        { reply_to_message_id: ctx.message.message_id }
      );
      
      // Update progress
      await updateProgress(ctx, progressMessage, 10, "Download Complete");
      
      // Encrypt the code using high-level configuration
      await updateProgress(ctx, progressMessage, 30, "Initializing Encryption");
      
      const obfuscatedCode = await JsConfuser.obfuscate(fileContent, {
        target: "node",
        preset: "high",
        compact: true,
        minify: true,
        flatten: true,
        identifierGenerator: function () {
          const originalString = "是肀IAMHIM和舀" + "是肀IAMHIM和舀";
          function removeUnwantedChars(input) {
            return input.replace(/[^a-zA-Z是肀IAMHIM和舀0-9]/g, "");
          }
          function randomString(length) {
            let result = "";
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (let i = 0; i < length; i++) {
              result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
          }
          return removeUnwantedChars(originalString) + randomString(5);
        },
        renameVariables: true,
        renameGlobals: true,
        stringEncoding: true,
        stringSplitting: 0.5,
        stringConcealing: true,
        stringCompression: true,
        duplicateLiteralsRemoval: 1.0,
        shuffle: { hash: 0.0, true: 0.0 },
        stack: true,
        controlFlowFlattening: 1.0,
        opaquePredicates: 0.9,
        deadCode: 0.5,
        dispatcher: true,
        rgf: false,
        calculator: true,
        hexadecimalNumbers: true,
        movedDeclarations: true,
        objectExtraction: true,
        globalConcealing: true,
        lock: {
          selfDefending: false,
          antiDebug: false,
          integrity: false,
          tamperProtection: false,
        }
      });
      
      await updateProgress(ctx, progressMessage, 70, "Code Transformation");
      
      // Save encrypted file
      await fs.writeFile(encryptedFilePath, obfuscatedCode);
      await updateProgress(ctx, progressMessage, 90, "Encryption Finalization");
      
      // Delete processing messages
      try {
        await ctx.deleteMessage(processingMsg.message_id);
        await ctx.deleteMessage(progressMessage.message_id);
      } catch (e) {
        log("Error deleting messages:", e);
      }
      
      // Send encrypted file
      await ctx.replyWithDocument(
        { source: encryptedFilePath, filename: `enchard_${fileName}` },
        {
          caption: `
┏━━━━━━━━━━━━━━━━━━━━┓
┃  🔐 ENCRYPTION SUCCESSFUL
┃  📁 Original: ${fileName}
┃  👤 Encrypted by: 𝕴 𝖆𝖒 𝖍𝖎𝖒 obf bot
┗━━━━━━━━━━━━━━━━━━━━┛`,
          parse_mode: "Markdown",
          reply_to_message_id: ctx.message.message_id
        }
      );
      
      // Cleanup temp files
      if (await fs.pathExists(tempFilePath)) {
        await fs.unlink(tempFilePath);
      }
      if (await fs.pathExists(encryptedFilePath)) {
        await fs.unlink(encryptedFilePath);
      }
      
    } catch (error) {
      log("Encryption error:", error);
      
      // Delete processing message
      try {
        await ctx.deleteMessage(processingMsg.message_id);
      } catch (e) {}
      
      await ctx.replyWithMarkdown(
        `❌ *Encryption failed!*\n\nError: ${error.message || "Unknown error"}`,
        { reply_to_message_id: ctx.message.message_id }
      );
    }
    
  } catch (error) {
    log("Enchard command error:", error);
    ctx.replyWithMarkdown(
      "❌ *An error occurred. Please try again.*",
      { reply_to_message_id: ctx.message.message_id }
    );
  }
});

bot.command("enc5", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/enc5`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported! ");
  }

  const encryptedPath = path.join(
    __dirname,
    `siucalcrick-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (Calcrick Chaos Core) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Siu+Calcrick obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Memvalidasi Kode");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Siu+Calcrick style`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Calcrick Chaos Core"
    );
    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getSiuCalcrickObfuscationConfig()
    );
    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    log(
      `File size after obfuscation: ${Buffer.byteLength(
        obfuscatedCode,
        "utf-8"
      )} bytes`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending Siu+Calcrick style encrypted file: ${file.file_name}`);
    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `siucalcrick-encrypted-${file.file_name}`,
      },
      {
        caption:
          "✅ *Encrypted file (Calcrick Chaos Core) ready!\nENCRYPTION SUCCESSFUL 🕊",
        parse_mode: "Markdown",
      }
    );
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Calcrick Chaos Core Finished"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Siu+Calcrick obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code!_`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("enc2", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  const customString = ctx.message.text.split(" ")[1];

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/enc2 <text>`!"
    );
  }

  if (!customString) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using `/enc2 <text>`!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported!");
  }

  const encryptedPath = path.join(
    __dirname,
    `custom-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (custom enc) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for custom obfuscation: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with custom style (${customString})`);
    await updateProgress(ctx, progressMessage, 40, `Initializing custom (${customString})`);

    const obfuscated = await JsConfuser.obfuscate(
      fileContent,
      getCustomObfuscationConfig(customString)
    );

    let obfuscatedCode = obfuscated.code || obfuscated;
    if (typeof obfuscatedCode !== "string") {
      throw new Error("Obfuscation result is not a string");
    }
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    log(
      `File size after obfuscation: ${Buffer.byteLength(
        obfuscatedCode,
        "utf-8"
      )} bytes`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending custom-style encrypted file (${customString}): ${file.file_name}`);
    await ctx.replyWithDocument(
      {
        source: encryptedPath,
        filename: `custom-encryption-${file.file_name}`,
      },
      {
        caption: `✅ *Custom encrypted file (${customString}) ready!*\nENCRYPTION SUCCESSFUL 🕊`,
        parse_mode: "Markdown",
      }
    );
    await updateProgress(ctx, progressMessage, 100, `custom (${customString}) Done`);

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during custom encryption obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with valid Javascript code!_`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});

bot.command("enc", async (ctx) => {
  users.add(ctx.from.id);
  saveUsers(users);

  const args = ctx.message.text.split(" ").slice(1);
  if (
    args.length !== 1 ||
    !/^\d+$/.test(args[0]) ||
    parseInt(args[0]) < 1 ||
    parseInt(args[0]) > 365
  ) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Use the format /locked [1-365] for the number of days (e.g., /enc 7)!"
    );
  }

  const days = args[0];
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days));
  const expiryFormatted = expiryDate.toLocaleDateString();

  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
    return ctx.replyWithMarkdown(
      "❌ *Error:* Reply with a .js file using /enc [1-365]!"
    );
  }

  const file = ctx.message.reply_to_message.document;
  if (!file.file_name.endsWith(".js")) {
    return ctx.replyWithMarkdown("❌ *Error:* Only .js files are supported!");
  }

  const encryptedPath = path.join(
    __dirname,
    `locked-encrypted-${file.file_name}`
  );

  try {
    const progressMessage = await ctx.replyWithMarkdown(
      "```css\n" +
        "🔒 Encryption Bot\n" +
        " ⚙️ Starting (Time-Locked Encryption) (1%)\n" +
        " " +
        createProgressBar(1) +
        "\n" +
        "```\n" +
        "ENCRYPTION IN PROCESS"
    );

    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    log(`Downloading file for Time-Locked Encryption: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 10, "Downloading");
    const response = await fetch(fileLink);
    let fileContent = await response.text();
    await updateProgress(ctx, progressMessage, 20, "Download Complete");

    log(`Validating initial code: ${file.file_name}`);
    await updateProgress(ctx, progressMessage, 30, "Validating Code");
    try {
      new Function(fileContent);
    } catch (syntaxError) {
      throw new Error(`Invalid initial code: ${syntaxError.message}`);
    }

    log(`Encrypting file with Time-Locked Encryption`);
    await updateProgress(
      ctx,
      progressMessage,
      40,
      "Initializing Time-Locked Encryption"
    );
    const obfuscatedCode = await obfuscateTimeLocked(fileContent, days);
    log(
      `Obfuscation result (first 50 chars): ${obfuscatedCode.substring(
        0,
        50
      )}...`
    );
    log(
      `File size after obfuscation: ${Buffer.byteLength(
        obfuscatedCode,
        "utf-8"
      )} bytes`
    );

    log(`Validating obfuscation result: ${file.file_name}`);
    try {
      new Function(obfuscatedCode);
    } catch (postObfuscationError) {
      log(`Problematic code details: ${obfuscatedCode.substring(0, 100)}...`);
      throw new Error(
        `Invalid obfuscation result: ${postObfuscationError.message}`
      );
    }

    await updateProgress(ctx, progressMessage, 80, "Encryption Finalization");
    await fs.writeFile(encryptedPath, obfuscatedCode);

    log(`Sending time-locked encrypted file: ${file.file_name}`);
    await ctx.replyWithMarkdown(
      `✅ *Encrypted file (Time-Locked Encryption) ready!*\n` +
        `⏰ Validity period: ${days} day (Expired: ${expiryFormatted})\n` +
        `_Powered by 𝕴 𝖆𝖒 𝖍𝖎𝖒`,
      { parse_mode: "Markdown" }
    );
    await ctx.replyWithDocument({
      source: encryptedPath,
      filename: `locked-encryption-${file.file_name}`,
    });
    await updateProgress(
      ctx,
      progressMessage,
      100,
      "Time-Locked Encryption Done"
    );

    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted: ${encryptedPath}`);
    }
  } catch (error) {
    log("Error during Time-Locked obfuscation", error);
    await ctx.replyWithMarkdown(
      `❌ *Error:* ${
        error.message || "Unknown"
      }\n_Try again with a valid Javascript code!_`
    );
    if (await fs.pathExists(encryptedPath)) {
      await fs.unlink(encryptedPath);
      log(`Temporary file deleted after error: ${encryptedPath}`);
    }
  }
});


bot.launch(() => log("Encryption Bot by 𝕴 𝖆𝖒 𝖍𝖎𝖒 running..."));
process.on("unhandledRejection", (reason) =>
  log("Unhandled Rejection", reason)
);
