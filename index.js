const http = require("http");
const querystring = require("querystring");
const fs = require("node:fs");
const path = require("node:path");
const fetch = require("node-fetch");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  Partials,
  ChannelType,
  EmbedBuilder,
  AttachmentBuilder,
  WebhookClient,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel, Partials.Reaction, Partials.Message],
});
client.commands = new Collection();
const {
  joinVoiceChannel,
  createAudioPlayer,
  NoSubscriberBehavior,
  EndBehaviorType,
  createAudioResource,
  VoiceConnectionStatus,
  StreamType,
  AudioPlayerStatus,
  demuxProbe,
  getVoiceConnection,
} = require("@discordjs/voice");
const { OpusEncoder } = require("@discordjs/opus");
const { PassThrough } = require("stream");
const { createReadStream } = require("node:fs");
const { Buffer } = require("node:buffer");
const { Blob } = require("buffer");
const { Readable } = require("stream");
const formdata = require("form-data");

http
  .createServer(function (req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        if (!data) {
          console.log("No post data");
          res.end();
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        res.end();
        if (dataObject.type == "reaction") {
          console.log("reaction");
          let reactChId = dataObject.reactChId,
            reactMesId = dataObject.reactMesId,
            reactGuildId = dataObject.reactGuildId,
            roleId = dataObject.roleId,
            roleId2 = dataObject.roleId2,
            enterStamp = dataObject.enterStamp,
            exitStamp = dataObject.exitStamp,
            recChId = dataObject.recChId;
          count(
            reactChId,
            reactMesId,
            reactGuildId,
            roleId,
            roleId2,
            enterStamp,
            exitStamp,
            recChId
          );
          res.end();
          return;
        }
        res.end();
        if (dataObject.type == "agendaMng") {
          console.log("agendaMng");
          var agdURL = dataObject.agdURL,
            agdTXT = dataObject.agdTXT,
            agdCGL = dataObject.agdCGL,
            agdNUM = dataObject.agdNUM;
          var response = sinngiSt(agdURL, agdTXT, agdCGL, agdNUM).then(
            (response) => {
              console.log(response);
            }
          );
          res.end();
          return;
        }
        res.end();
        if (dataObject.type == "finish") {
          console.log("ponnpoko:" + dataObject.type);
          let userId = dataObject.userID;
          sendDm(userId, dataObject.comment);
          res.end();
          return;
        }
        if (dataObject.type == "finish2") {
          console.log("darumasann:" + dataObject.type);
          let channelId = dataObject.userID;
          if (dataObject.options != null) {
            let options = JSON.parse(dataObject.options);
            if (options.ext == "ext") {
              sendMsgWithFrags(channelId, dataObject.comment, options);
            } else {
              sendMsg(channelId, dataObject.comment);
            }
          } else {
            sendMsg(channelId, dataObject.comment);
          }
          res.end();
          return;
        }
        if (dataObject.type == "kotaeMng") {
          console.log("kotaeMng");
          var channelID = dataObject.channelID;
          var quizID = dataObject.quizID;
          quizReq(channelID, quizID);
          res.end();
          return;
        }
        if (dataObject.type == "countMng") {
          console.log("countMng");
          var channelID = dataObject.channelID,
            comment = dataObject.comment;
          /*var fromMesID = dataObject.fromMesID;*/
          darumaCounter(channelID, comment);
          res.end();
          return;
        }
        if (dataObject.type == "voiceOn") {
          console.log("voiceOn");
          var guildId = dataObject.guildId,
            vcId = dataObject.vcId,
            options = dataObject.options;
          /*var fromMesID = dataObject.fromMesID;*/
          voiceOn(guildId, vcId, options);
          res.end();
          return;
        }
        if (dataObject.type == "webhook1") {
          console.log("webhook1");
          webhook1(dataObject);
          res.end();
          return;
        }
        if (dataObject.type == "pdfToPng") {
          console.log("pdfToPng");
          pdfToPngController(dataObject.channelID);
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Discord Bot is active now\n");
    }
  })
  .listen(process.env.PORT);

client.once(Events.ClientReady, (c) => {
  console.log("Bot準備完了～");
  client.user.setPresence({ activities: [{ name: "サーバー補佐" }] });
});

if (process.env.OPERAS == undefined) {
  console.log("OPERASが設定されていません。");
  process.exit(0);
}

client.login(process.env.OPERAS);

async function count(
  reactChId,
  reactMesId,
  reactGuildId,
  roleId,
  roleId2,
  enterStamp,
  exitStamp,
  recChId
) {
  const enterStampS = String(enterStamp).replace(/<:/, "").replace(/:.*/, ""),
    exitStampS = String(exitStamp).replace(/<:/, "").replace(/:.*/, "");
  const messageReacted = await client.channels.cache
    .get(String(reactChId)) //試験用：1168351647337029782　実用：1175754185271169044
    .messages.fetch(String(reactMesId)); //試験用：1175112607670218822　実用：1175780865188581487
  let type = [];

  messageReacted.reactions.cache.forEach(async (reaction) => {
    const emojiName = reaction._emoji.name;
    const emojiCount = reaction.count;
    const reactionUsers = Array.from(await reaction.users.fetch());
    /*console.log(emojiName, reactionUsers);*/

    const guild = await client.guilds.cache.get(String(reactGuildId)); //試験用：1168349939525505054　実用：1071288663884959854
    const members = await guild.members.fetch();
    const roleT = await guild.roles.cache.get(String(roleId)); //試験用：1175113333851050014　実用：1071290225499840512
    let role2T;
    if (roleId2 != "") {
      role2T = await guild.roles.cache.get(String(roleId2));
    } //リクエスト内が空欄なら使わない

    console.log("reactionUsers.length: ", reactionUsers.length);
    /*console.log(role);*/
    console.log("emoji: ", emojiName, "role: ", typeof roleT);
    /*for(let round = 0; round < 2; round++){
    console.log("round", round);
    let rabel = "新規？: ",stampS = enterStampS, remS = exitStampS;
    if(round == 1){rabel = "抹消？: ", stampS = exitStampS, remS = enterStampS;}*/
    var cV = 0;
    while (cV < reactionUsers.length) {
      try {
        if (
          //"✅"
          emojiName === String(enterStampS) &&
          String(reactionUsers[cV][0]) !== "835710830417805383"
        ) {
          //はわのふ以外
          console.log("新規？: ", String(reactionUsers[cV][0]));
          var member = await guild.members.cache.get(reactionUsers[cV][0]);
          /*console.log(member);*/
          if (await member.roles.cache.has(String(roleId))) {
            var cnew = "";
          } else {
            var cnew = " 🆕"; //" 🆕"
            await reactRemove(
              messageReacted,
              reactionUsers[cV][0],
              String(exitStampS),
              "0"
            ); //以前のリアクションは解除。message, userId, emojiId
            await member.roles.add(roleT);
            if (roleId2 != "") {
              await member.roles.remove(role2T);
            }
            type.push([String(reactionUsers[cV][0]), "✅"]);
          } //試験用：1175113333851050014　実用：1071290225499840512
          sendMsg(
            String(recChId),
            String(enterStamp) + ": " + String(reactionUsers[cV][0]) + cnew
          ); //試験用：1175452034338660503　実用：1177070862428549132
        } else if (
          //"🔚"
          emojiName === String(exitStampS) &&
          String(reactionUsers[cV][0]) !== "835710830417805383"
        ) {
          //はわのふ以外
          console.log("抹消？: ", String(reactionUsers[cV][0]));
          var member = await guild.members.cache.get(reactionUsers[cV][0]);
          /*console.log(member);*/
          if (await member.roles.cache.has(String(roleId))) {
            var cnew = "";
            for (let ro = 0; ro < type.length; ro++) {
              //新規でロール付与していた場合→ロール除去もリアクション削除も行わない。
              if (String(reactionUsers[cV][0]) == String(type[ro][0])) {
                cnew = "";
                break;
              }
              if (Number(ro) == type.length - 1) {
                cnew = " 🆕"; //" 🆕"
                await reactRemove(
                  messageReacted,
                  reactionUsers[cV][0],
                  String(enterStampS),
                  "1"
                ); //以前のリアクションは解除。message, userId, emojiId
                await member.roles.remove(roleT);
                if (roleId2 != "") {
                  await member.roles.add(role2T);
                }
              }
            }
            if (type.length == 0) {
              cnew = " 🆕"; //" 🆕"
              await reactRemove(
                messageReacted,
                reactionUsers[cV][0],
                String(enterStampS),
                "2"
              ); //以前のリアクションは解除。message, userId, emojiId
              await member.roles.remove(roleT);
              if (roleId2 != "") {
                await member.roles.add(role2T);
              }
            }
          } else {
            var cnew = "";
          } //試験用：1175113333851050014　実用：1071290225499840512
          sendMsg(
            String(recChId),
            String(exitStamp) + ": " + String(reactionUsers[cV][0]) + cnew
          ); //試験用：1175452034338660503　実用：1177070862428549132
        }
      } catch (e) {
        console.log(e);
      }
      cV++;
    } /*}*/
    /*    var bV = 0;
    while (bV < reactionUsers.length) {
      try {
        if (
          //"🔚"
          emojiName === String(exitStampS) &&
          String(reactionUsers[bV][0]) !== "835710830417805383"
        ) {
          //はわのふ以外
          console.log("抹消？: ", String(reactionUsers[bV][0]));
          var member = await guild.members.cache.get(reactionUsers[bV][0]);
          if (await member.roles.cache.has(String(roleId))) {
            var bnew = " 🆕";
            await reactRemove(reactMesId, reactionUsers[cV][0], String(enterStampS));//以前のリアクションは解除
          } else {
            var bnew = "";
          } //試験用：1175113333851050014　実用：1071290225499840512
          member.roles.remove(roleT);
          sendMsg(
            String(recChId),
            String(exitStamp) + ": " + String(reactionUsers[bV][0]) + bnew
          ); //試験用：1175452034338660503　実用：1177070862428549132
        }
      } catch (e) {
        console.log(e);
      }
      bV++;
    }*/
    return;
  });
}

async function reactRemove(messageReacted, userId, emojiName, type) {
  const userReactions = messageReacted.reactions.cache.filter((reaction) =>
    reaction.users.cache.has(userId)
  );

  try {
    for (const reaction of userReactions.values()) {
      if (reaction._emoji.name == emojiName) {
        await reaction.users.remove(userId);
      }
      console.log(
        "投稿",
        String(messageReacted),
        "",
        String(userId),
        "のリアクションを削除しました",
        String(type)
      );
    }
  } catch (error) {
    console.error(
      error,
      "投稿",
      String(messageReacted),
      "",
      String(userId),
      "のリアクション削除に失敗しました",
      String(type)
    );
  }
}

//審議入り・呼びかけ・リマインド
async function sinngiSt(agdURL, agdTXT, agdCGL, agdNUM) {
  console.log(
    agdURL.toString(),
    agdTXT.toString(),
    agdCGL.toString(),
    Number(agdNUM)
  );
  var sinngiIs = "",
    gityouTo = "1177070862428549132"; //議長向け通知の宛先。練習用: 1175452034338660503 実用: 1177070862428549132

  if (agdCGL.toString() == "A") {
    console.log("A");
    var channelIDs = [
      "1071303625281900574",
      "1071303655904518234",
      "1071303683020693544",
    ]; //審議室イ～ハ
  }
  if (agdCGL.toString() == "B") {
    console.log("B");
    var channelIDs = [
      "1074924206095085698",
      "1091198099264909352",
      "1096095375934369863",
      "1142050303886237766",
    ]; //審議室ニ～ト
  }
  if (agdCGL.toString() == "Y") {
    console.log("Y");
    var channelIDs = ["1071303499352117269"]; //投票所 試験用: 1168351647337029782 実用: 1071303499352117269
  }
  if (agdCGL.toString() == "Z" || agdCGL.toString() == "X") {
    console.log(agdCGL.toString());
    var channelIDs = [
      "1071303625281900574",
      "1071303655904518234",
      "1071303683020693544",
      "1074924206095085698",
      "1091198099264909352",
      "1096095375934369863",
      "1142050303886237766",
    ]; //審議室イ～ト
  }
  /*console.log(channelIDs);*/
  var now = new Date(),
    nowMinus2h = now.setHours(now.getHours() - 13); //最後の投稿から12時間に設定(botの稼働は24時間おき)-13
  console.log("呼びかけ対象時刻: ", nowMinus2h);
  const guild = await client.guilds.cache.get("1071288663884959854"); //試験用：1168349939525505054　実用：1071288663884959854
  const members = await guild.members.fetch();
  /*console.log(members);*/
  var kaishiNum = 0, //kaishiNumは上から空室の数を数える（1件目の議題は1つめの空室に、2件目の議題は2つめの空室に...）。
    kaishiNum2 = 0; //kaishiNum2は議題が入ったかどうか記録する（入れば1になる）。
  var j = 0;

  while (j < channelIDs.length) {
    /*console.log(channelIDs);*/
    try {
      var chan = channelIDs[j];
      var channel = await client.channels.cache.get(chan);

      const sleep = (second) =>
        new Promise((resolve) => setTimeout(resolve, second * 1000));

      await sleep(2);
      var response2 = await channel.messages
        .fetch({ limit: 1 })
        .then(async (messages) => {
          var lastMessage = messages.first();
          var member = await guild.members.cache.get(lastMessage.author.id);
          console.log(
            "チャンネル: ",
            chan,
            "最新の投稿: ",
            lastMessage.content
          );
          var motAfIs = await pastMessageIs(
            guild,
            channel,
            lastMessage,
            nowMinus2h,
            chan,
            gityouTo
          ).then(async function (motAfIs) {
            console.log("motAfIs[0]: ", motAfIs[0]);

            var lastMesRole = "0";
            try {
              if (await member.roles.cache.has("1089034307500249179")) {
                //なぜかfalseが返ってくる。
                var lastMesRole = "1089034307500249179";
              }
              if (await member.roles.cache.has("1100657196783632447")) {
                var lastMesRole = "1100657196783632447";
              }
              if (await member.roles.cache.has("1175447455433764966")) {
                var lastMesRole = "1175447455433764966";
              }
            } catch (e) {
              console.log(e);
            }
            console.log("lastMesRole: ", lastMesRole);
            //zの場合は、呼びかけを行う
            let toward = null,
              mesIs = null;
            if (
              agdCGL.toString() == "Z" &&
              lastMessage.createdAt.getTime() < nowMinus2h
            ) {
              await sendMsg(
                gityouTo,
                "▼---<#" + channelIDs[j].toString() + ">---"
              );

              if (
                lastMessage.content.match(
                  /^@各位\nご意見・ご質問などありましたら、引き続きぜひ述べてください。$/
                ) &&
                (lastMesRole == "1089034307500249179" ||
                  lastMesRole == "1100657196783632447" ||
                  lastMesRole == "1175447455433764966")
              ) {
                (toward = channelIDs[j]),
                  (mesIs =
                    "-----\nこちらの議題は、そろそろまとめに入りたいと思います。引き続き、意見などはぜひ述べてください。");
              } else if (
                lastMessage.content.match(
                  /^-----\nこちらの議題は、そろそろまとめに入りたいと思います。引き続き、意見などはぜひ述べてください。$/
                ) &&
                (lastMesRole == "1089034307500249179" ||
                  lastMesRole == "1100657196783632447" ||
                  lastMesRole == "1175447455433764966")
              ) {
                (toward = gityouTo),
                  (mesIs = "<@&1089034307500249179> まとめをお願いします。"); //通報チャンネル→試験用：1175452034338660503　実用：--
              } else if (
                lastMessage.content.match(
                  /（まとめは、先日載せたものを更新してこれに充てます。）/
                ) &&
                (lastMesRole == "1089034307500249179" ||
                  lastMesRole == "1100657196783632447" ||
                  lastMesRole == "1175447455433764966")
              ) {
                var matoAfC = 0, //まとめる場合は1になる
                  matoAfD = 0, //発言を挟んで採決セットを発行する場合は8か9になる
                  matoAfD2 = 1, //採決セットが過去にある場合は1になり、matoAfDを8にさせる
                  matoAfE = 1; //まとめ関連の議事進行発言が見つかるとそれぞれ「1」[9][4]になる。
                let befT = [lastMessage.id, 1]; //メッセージIDと「@各位～」のカウンタの初期値
                let winding = 50; //さかのぼるメッセージ数の初期値
                motAfIs = await tuduki(
                  guild,
                  channel,
                  nowMinus2h,
                  matoAfC,
                  matoAfD,
                  matoAfD2,
                  matoAfE,
                  befT,
                  winding
                ).then(async function (motAfIs) {
                  //採決セット発行（改定後採決）
                  await matome(motAfIs[1]);
                  (toward = gityouTo),
                    (mesIs =
                      "<@&1089034307500249179> まとめ改定の上、採決をお願いします。");
                  await sendMsg(chan, "▼処理中。本投稿消滅まで発言不可▼");
                });
              } //
              else if (
                lastMessage.content.match(
                  /今回の議論をまとめてみたのですが、これにて一旦審議終結としても異議はありませんでしょうか？/
                ) &&
                (lastMesRole == "1089034307500249179" ||
                  lastMesRole == "1100657196783632447" ||
                  lastMesRole == "1175447455433764966")
              ) {
                //採決セット発行（そのまま採決）
                await matome(lastMessage);
                (toward = gityouTo),
                  (mesIs = "<@&1089034307500249179> 採決をお願いします。");
              } else if (
                lastMessage.content.match(/^〆$/) &&
                (lastMesRole == "1089034307500249179" ||
                  lastMesRole == "1100657196783632447" ||
                  lastMesRole == "1175447455433764966")
              ) {
                (toward = gityouTo), (mesIs = "（空室）");
              } else if (motAfIs[0] == 3) {
                (toward = channelIDs[j]),
                  (mesIs =
                    "-----\nこちらの議題は、そろそろまとめに入りたいと思います。引き続き、意見などはぜひ述べてください。");
              } else if (motAfIs[0] == 1) {
                (toward = gityouTo),
                  (mesIs =
                    "<@&1089034307500249179> 新規投稿確認の上、まとめをお願いします。");
              } else if (motAfIs[0] == 9 || motAfIs[0] == 8) {
                //採決セット発行（改定後採決）
                await matome(motAfIs[1]);
                (toward = gityouTo),
                  (mesIs =
                    "<@&1089034307500249179> まとめ改定の上、採決をお願いします。");
                await sendMsg(chan, "▼処理中。本投稿消滅まで発言不可▼");
              } else if (motAfIs[0] == 80) {
                //採決セット発行（なお審議続行）
                await matome(motAfIs[1]);
                (toward = channelIDs[j]),
                  (mesIs =
                    "@各位\nご意見・ご質問などありましたら、引き続きぜひ述べてください。");
              } else {
                (toward = channelIDs[j]),
                  (mesIs =
                    "@各位\nご意見・ご質問などありましたら、引き続きぜひ述べてください。");
              }

              if (toward != "NO-SEND") {
                await sendMsg(gityouTo, mesIs);
              } //通報チャンネル→試験用：1175452034338660503　試験用2: gityouTo 実用：chan
              console.log(toward, "で", mesIs, "と発言呼びかけ");
            }
          });

          async function matome(matoMes) {
            await channel.messages
              .fetch({ before: matoMes.id, limit: 1 })
              .then(async (messages) => {
                var beforeMessage = messages.first(),
                  beforeCont = beforeMessage.content.toString(),
                  beforeURL = beforeMessage.url;
                var mesPollAgdP = beforeCont.substring(
                  beforeCont.indexOf("議題「") + 3,
                  beforeCont.indexOf("」については")
                );
                var mesPollAgd =
                  "<#" +
                  channelIDs[j].toString() +
                  "> " +
                  " " +
                  beforeURL +
                  " の議題\n" +
                  mesPollAgdP;
                await sendMsg(gityouTo, mesPollAgd);
                var mesMatome =
                  "【参考】これまでの審議まとめ\n```" +
                  beforeCont.substring(beforeCont.indexOf("→議題"));
                await sendMsg(gityouTo, mesMatome);
                var mesPollRec = "議題\n" + mesPollAgdP;
                await sendMsg(gityouTo, mesPollRec);
                var toward = "NO-SEND";
                console.log("チャンネル: ", chan, "該当の投稿: ", mesMatome);
                return [toward];
              });
          }

          //Yの場合は、結果を出力する
          if (
            agdCGL.toString() == "Y" &&
            lastMessage.content.match(/件への投票/)
          ) {
            var kennsuuT = lastMessage.content.toString();
            var numT = kennsuuT.substring(
              kennsuuT.indexOf("件") - 1,
              kennsuuT.indexOf("件")
            );
            var befT = lastMessage.id; //初期値
            for (var k = 0; k < Number(numT); k++) {
              if (k == 0) {
                var backT = 1;
              } else {
                var backT = 2;
              }
              var befT = await channel.messages
                .fetch({ before: befT, limit: backT })
                .then(async (messages) => {
                  var beforeMessage = messages.last(),
                    beforeCont = beforeMessage.content.toString(),
                    beforeURL = beforeMessage.url;
                  console.log("beforeCont", beforeCont);
                  var circleT = myPromise2(beforeMessage).then(async function (
                    emojiIs
                  ) {
                    console.log(
                      "emojiIs: ",
                      emojiIs,
                      "next befT is: ",
                      beforeMessage.id
                    );
                    var oneT = emojiIs[0] - 1,
                      twoT = emojiIs[1] - 1,
                      threeT = emojiIs[2] - 1;
                    {
                      if (oneT > twoT) {
                        var kekkaT = "可決";
                      } else {
                        var kekkaT = "否決";
                      }
                    }
                    await sendMsg(gityouTo, beforeURL);
                    var mesT =
                      "〆\n賛成" +
                      oneT +
                      "、反対" +
                      twoT +
                      "、棄権" +
                      threeT +
                      "との結果を得ました。よって本案は" +
                      kekkaT +
                      "されたものと認めます。";
                    await sendMsg(gityouTo, mesT);
                    console.log(
                      "Number(numT): ",
                      Number(numT),
                      "beforeURL: ",
                      beforeURL
                    );
                  });
                  return beforeMessage.id;
                });
            }
          }

          //X場合は、メッセージを消去する
          if (
            agdCGL.toString() == "X" &&
            lastMessage.content.match(/^▼処理中。本投稿消滅まで発言不可▼$/)
          ) {
            console.log("X 削除します: ", channelIDs[j], lastMessage.content);
            await channel.messages //マーキング「▼処理中。本投稿消滅まで発言不可▼」を削除
              .fetch(String(lastMessage.id))
              .then(async (message) => {
                message.delete();
              });
          }

          //AかBの場合は、審議すべき所に割り当てる
          if (
            (agdCGL.toString() == "A" || agdCGL.toString() == "B") &&
            (lastMessage.content.match(/^〆$/) ||
              lastMessage.content.match(
                /今回の議論をまとめてみたのですが、これにて一旦審議終結としても異議はありませんでしょうか？/
              ) ||
              lastMessage.content.match(/^▼処理中。本投稿消滅まで発言不可▼$/))
          ) {
            console.log(
              "!!!",
              agdTXT,
              kaishiNum,
              Number(agdNUM),
              lastMessage.content.match(/^▼処理中。本投稿消滅まで発言不可▼$/)
            );
            //通報チャンネル→試験用：1175452034338660503　実用：chan
            if (kaishiNum == Number(agdNUM)) {
              await sendMsg(
                gityouTo,
                "▼▼--<#" + channelIDs[j].toString() + ">---"
              );
              await sendMsg(gityouTo, agdURL); //提出されたメッセージへのリンク（URL）を送る
              await sendMsg(gityouTo, agdTXT); //議題テクストを送る
              /*await channel.messages
                .fetch({ limit: 1 })
                .then(async (messages) => {
                  //採決用メッセージを作る
                  var beforeMessage = messages.first(),
                    beforeURL = beforeMessage.url,
                    beforeCont = beforeMessage.content.toString();
                  var mesSaiketu =
                    "<#" +
                    channelIDs[j].toString() +
                    "> " +
                    beforeURL +
                    " " +
                    beforeCont;
                  await sendMsg(gityouTo, mesSaiketu);
                  console.log("チャンネル: ", chan, "該当の投稿: ", mesSaiketu);
                });*/
              await sendMsg(
                gityouTo,
                "<@&1071290225499840512> ご審議願います。"
              ); //ロール→試験用：1175113333851050014　実用：1071290225499840512
              console.log(channelIDs[j], "で", agdTXT, "の審議開始");
              await callApi(agdURL, "予約の取り消し");
              var sinngiIs = "審議開始";
              kaishiNum2++;
            }
            kaishiNum++;
          }
          if (
            (agdCGL.toString() == "A" || agdCGL.toString() == "B") &&
            (lastMessage.content.match(/^〆$/) ||
              lastMessage.content.match(
                /今回の議論をまとめてみたのですが、これにて一旦審議終結としても異議はありませんでしょうか？/
              ) ||
              lastMessage.content.match(
                /^▼処理中。本投稿消滅まで発言不可▼$/
              )) &&
            kaishiNum - 1 == Number(agdNUM) //kaishiNumは上で1足されているので、その分1引いて値を整えている。
          ) {
            var mesChk = Number(agdNUM) + 1;
            console.log(
              "審議待ち検索 稼働済み その" + agdCGL.toString() + mesChk
            );
            await sendMsg(
              gityouTo,
              "審議待ち検索 稼働済み その" + agdCGL.toString() + mesChk
            );
            return "審議開始";
          }
          console.log("j: ", j, "kaishiNum: ", kaishiNum);
          if (agdCGL.toString() == "Z" && j == channelIDs.length - 1) {
            console.log("呼びかけ 稼働済み");
            await sendMsg(gityouTo, "呼びかけ 稼働済み");
            return "呼びかけ";
          }
          if (
            (agdCGL.toString() == "A" || agdCGL.toString() == "B") &&
            kaishiNum2 == 0 &&
            j == channelIDs.length - 1
          ) {
            console.log(agdTXT, "審議室空きなし");
            await sendMsg(
              gityouTo,
              "- " + agdURL + " " + agdTXT + " 審議室空きなし"
            );
          }
          if (
            (agdCGL.toString() == "A" || agdCGL.toString() == "B") &&
            j == channelIDs.length - 1
          ) {
            var mesChk = Number(agdNUM) + 1;
            console.log(
              "審議待ち検索 稼働済み その" + agdCGL.toString() + mesChk
            );
            await sendMsg(
              gityouTo,
              "審議待ち検索 稼働済み その" + agdCGL.toString() + mesChk
            );
          }
        })
        .catch(console.error);
    } catch (e) {
      console.log(e);
    }
    j++;
  }
  return response2;
}

//まとめ予告の有無・まとめ改定の要否チェック
async function pastMessageIs(
  guild,
  channel,
  lastMessage,
  nowMinus2h,
  chan,
  gityouTo
) {
  var matoAfC = 0, //まとめる場合は1になる
    matoAfD = 0, //発言を挟んで採決セットを発行する場合は8か9になる
    matoAfD2 = 0, //採決セットが過去にある場合は1になり、matoAfDを8にさせる
    matoAfE = 0; //まとめ関連の議事進行発言が見つかるとそれぞれ「1」[9][4]になる。
  let befT = [lastMessage.id, 1]; //メッセージIDと「@各位～」のカウンタの初期値
  let winding = 4; //さかのぼるメッセージ数の初期値
  let ret = await tuduki(
    guild,
    channel,
    nowMinus2h,
    matoAfC,
    matoAfD,
    matoAfD2,
    matoAfE,
    befT,
    winding
  );
  /*if (Number(ret[0]) == 7) {
    (winding = 50), (befT = [String(ret[1]), 1]);
    ret = await tuduki(
      guild,
      channel,
      nowMinus2h,
      matoAfC,
      matoAfD,
      matoAfD2,
      matoAfE,
      befT,
      winding
    );
  }*/
  return ret;
}

//続き
async function tuduki(
  guild,
  channel,
  nowMinus2h,
  matoAfC,
  matoAfD,
  matoAfD2,
  matoAfE,
  befT,
  winding
) {
  for (var matoAf = 0; matoAf < Number(winding); matoAf++) {
    console.log("befT[0]", befT[0], "befT[1]", befT[1], "matoAfE", matoAfE);
    if (Number(befT[0]) == 1) {
      //まとめ要請
      //befTには初期値や通常のループではメッセージIDが代入されるが、うまくいった場合にはmatoAfCやmatoAfDの値が代入されている
      matoAfC = 1;
      return [1, befT[2]];
    }
    if (Number(befT[1]) == 2) {
      matoAfE = 0;
    }
    if (Number(befT[1]) == 3) {
      matoAfE = 3;
      return [3, befT[2]];
    }
    if (Number(befT[3]) == 7) {
      (matoAfD2 = 1), (matoAfE = 1);
      winding = matoAf + 50;
      console.log("befTは7", "winding", winding);
      /*return [7, befT[0]];*/
    }
    if (Number(befT[0]) == 8) {
      matoAfD = 8;
      return [8, befT[2]];
    }
    if (Number(befT[0]) == 9) {
      //採決セット発行
      matoAfD = 9;
      return [9, befT[2]];
    }
    if (befT[0] == 0) {
      console.log("END");
      return [0, 0, 0];
    }
    befT = await channel.messages
      .fetch({ before: befT[0], limit: 1 })
      .then(async (messages) => {
        /*console.log("matoAf: ", matoAf, "matoAfC: ", matoAfC);*/
        var beforeMessage = messages.first();
        var beforeCont = beforeMessage.content;
        var member = await guild.members.cache.get(beforeMessage.author.id);
        var befMesRole = "0";
        try {
          if (await member.roles.cache.has("1089034307500249179")) {
            //なぜかfalseが返ってくる。
            var befMesRole = "1089034307500249179";
          }
          if (await member.roles.cache.has("1100657196783632447")) {
            var befMesRole = "1100657196783632447";
          }
          if (await member.roles.cache.has("1175447455433764966")) {
            var befMesRole = "1175447455433764966";
          }
        } catch (e) {
          console.log(e);
        }
        /*console.log("チャンネル: ", chan, "Afの投稿: ", beforeCont, "createdAt: ", beforeMessage.createdAt.getTime(), "befMesRole: ", befMesRole);*/
        if (
          beforeMessage.createdAt.getTime() < nowMinus2h &&
          matoAfC == 0 &&
          (befMesRole == "1089034307500249179" ||
            befMesRole == "1100657196783632447" ||
            befMesRole == "1175447455433764966") &&
          beforeCont.match(/ご審議願います/)
        ) {
          return [0, 0, beforeMessage];
        }
        if (
          beforeMessage.createdAt.getTime() < nowMinus2h &&
          matoAfE == 0 &&
          (befMesRole == "1089034307500249179" ||
            befMesRole == "1100657196783632447" ||
            befMesRole == "1175447455433764966") &&
          beforeCont.match(
            /@各位\nご意見・ご質問などありましたら、引き続きぜひ述べてください。/
          )
        ) {
          matoAfE == 3;
          return [beforeMessage.id, Number(1 + Number(befT[1])), beforeMessage];
        }
        if (
          beforeMessage.createdAt.getTime() < nowMinus2h &&
          matoAfC == 0 &&
          (befMesRole == "1089034307500249179" ||
            befMesRole == "1100657196783632447" ||
            befMesRole == "1175447455433764966") &&
          beforeCont.match(
            /（まとめは、先日載せたものを更新してこれに充てます。）/
          )
        ) {
          (matoAfD = 7), (winding = 50), (matoAfD2 = 1);
          console.log("AAAA");
          return [beforeMessage.id, 0, beforeMessage, 7];
        }
        if (
          beforeMessage.createdAt.getTime() < nowMinus2h &&
          matoAfC == 0 &&
          matoAfD2 != 1 &&
          (befMesRole == "1089034307500249179" ||
            befMesRole == "1100657196783632447" ||
            befMesRole == "1175447455433764966") &&
          beforeCont.match(
            /^-----\nこちらの議題は、そろそろまとめに入りたいと思います。引き続き、意見などはぜひ述べてください。$/
          )
        ) {
          matoAfC == 1;
          return [1, 0, beforeMessage];
        }
        if (
          beforeMessage.createdAt.getTime() < nowMinus2h &&
          matoAfC == 0 &&
          (befMesRole == "1089034307500249179" ||
            befMesRole == "1100657196783632447" ||
            befMesRole == "1175447455433764966") &&
          beforeCont.match(
            /今回の議論をまとめてみたのですが、これにて一旦審議終結としても異議はありませんでしょうか？/
          )
        ) {
          if (matoAfD2 == 1) {
            matoAfD = 8;
          } else {
            matoAfD = 9;
          }
          return [Number(matoAfD), 0, beforeMessage];
        }
        return [beforeMessage.id, Number(befT[1]), beforeMessage];
      });
    if (matoAf == Number(winding) - 1 || matoAf > 200) {
      return [0, 0, 0];
    }
  }
}

//採決の検索
function myPromise2(beforeMessage) {
  return new Promise(function (resolve, reject) {
    var emojiCs = Promise.all(
      beforeMessage.reactions.cache.map(async (reaction) => {
        const emojiName = reaction._emoji.name;
        const emojiCount = reaction.count;
        const reactionUsers = Array.from(await reaction.users.fetch());
        console.log(emojiName, emojiCount);
        return emojiCount;
      })
    );
    resolve(emojiCs);
  });
}

//審議開始後の処理
async function callApi(url, hennkou) {
  try {
    var okuruNaiyou = {
      url: url,
      hennkou: hennkou,
    };
    var okuruJson = JSON.stringify(okuruNaiyou);
    const uri = String(process.env.uri1);
    const res = await fetch(uri, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: okuruJson,
    });
    /*const kekka = await res.json();
    const strings = await JSON.parse(JSON.stringify(kekka));
    const data = strings["結果"];
    console.log(data)*/
    return;
  } catch (error) {
    console.log(error);
    return "APIエラーでは？";
  }
}

//クイズ用。指定したメッセージについて選択肢ごとにIDの配列を返す
async function quizReq(channelId, quizId) {
  var channelId = channelId.toString();
  var quizId = quizId.toString();
  console.log("quizId: ", quizId);
  const messageReacted2 = await client.channels.cache
    .get(channelId) //試験用：1180401046825209937　実用：1175754185271169044
    .messages.fetch(quizId);
  let mes = "?csvpoll " + channelId + "-" + quizId;
  await sendMsg("1180737032876720128", mes); //試験用：1180401046825209937　実用：1180737032876720128
  var circleT = myPromise2q(messageReacted2).then(async function (emojiIs2) {
    console.log("emojiIs2: ", emojiIs2[1]);
    await quizReturn(quizId, emojiIs2);
    return "成功です";
  });
}

function myPromise2q(beforeMessage) {
  return new Promise(function (resolve, reject) {
    var emojiCs = Promise.all(
      beforeMessage.reactions.cache.map(async (reaction) => {
        const emojiName = reaction._emoji.name;
        const emojiCount = reaction.count;
        const reactionUsers = Array.from(await reaction.users.fetch());
        console.log(emojiName, emojiCount);
        return [emojiName, reactionUsers];
      })
    );
    resolve(emojiCs);
  });
}

//同上
async function quizReturn(quizId, reactionerIds2) {
  try {
    var okuruNaiyou = {
      quizId: quizId,
      answers: reactionerIds2,
    };
    var okuruJson = JSON.stringify(okuruNaiyou);
    console.log(okuruJson);
    const uri = String(process.env.uri2);
    const res = await fetch(uri, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: okuruJson,
    });
    const kekka = await res.json();
    const strings = await JSON.parse(JSON.stringify(kekka));
    const data = strings["結果"];
    console.log("data: ", data);
    return;
  } catch (error) {
    console.log(error);
    return "APIエラーでは？";
  }
}

//だるまさんがころんだ用
async function darumaCounter(channelID, comment) {
  console.log("channelID", channelID, "comment", comment);
  /*let befT = [String(fromMesID), String(fromAuth), Number(fromNum)]; //初期値*/
  const guild = await client.guilds.cache.get("1071288663884959854"); //試験用：1168349939525505054　実用：1071288663884959854
  var channel = await client.channels.cache.get(String(channelID));
  let now = new Date(),
    nowMinus2h = now.setHours(now.setHours() - 25),
    befC = 0;
  var response2 = await channel.messages //終点を決める
    .fetch({ limit: 1 })
    .then(async (messages) => {
      var lastMessage = messages.first();
      var member = await guild.members.cache.get(lastMessage.author.id);
      console.log(
        "チャンネル: ",
        channelID,
        "最新の投稿: ",
        lastMessage.content
      );
      if (comment == "START") {
        await lastMessage.react("🏁");
        return;
      }
      let act2 = await callCountApi("照会", ""),
        lMes,
        lMesId,
        lMesCont;
      (lMesId = lastMessage.id), (lMesCont = Number(lastMessage.content));
      console.log(
        "act2",
        String(act2[0][0]) == "OK" && String(act2[0][2]) != "滞留はありません"
      );
      if (
        String(act2[0][0]) == "OK" &&
        String(act2[0][2]) != "滞留はありません"
      ) {
        for (let i = 0; i < 10; i++) {
          lMes = await befTAinq(guild, channel, channelID, String(act2[0][2]));
          if (String(lMes[0]) == "OK") {
            (lMesId = lMes[1].id), (lMesCont = lMes[1].content);
            break;
          } else {
            await callCountApi("削除", "");
          }
        }
      }
      let befTA = [lMesId, 0, Number(lMesCont)],
        befIDarr = [];
      console.log("befTA[1]", befTA[1]);
      befIDarr = await befTAis(channel, channelID, befTA, befIDarr);
      console.log("befIDarr", befIDarr);
      if (befIDarr[befIDarr.length - 1][1] == 9) {
        await callCountApi("入力", String(befIDarr[befIDarr.length - 1][0]));
        /*await lastMessage.react("🏁");*/
        return;
      }
      let befT = [0, befIDarr[befIDarr.length - 1][2], 0, 0],
        bIDar2 = 0,
        bIDar3 = 0,
        esc = 0;
      for (let i = befIDarr.length; i > 1; i--) {
        //最初に空き配列があるので「1」になる
        if (befT[0] == "ERROR") {
          break;
        }
        befT = await channel.messages
          .fetch({ after: befIDarr[i - 1][0], limit: 1 })
          .then(async (messages) => {
            var beforeMessage = messages.first();
            var beforeCont = beforeMessage.content;
            var beforeAuthor = beforeMessage.author.id;
            try {
              if (
                String(beforeCont).search(/^\d|^\(/) == -1 ||
                String(beforeCont).search(/\d$|\)$/) == -1 ||
                String(beforeCont).search(/[^\d*|(\/)|(\*)|(\+)|(\-)|\(|\)]/) !=
                  -1
              ) {
                //関係ないので、参照するコンテントとオーサーIDの配列は古いままとする。
                console.log("対象外の投稿");
                esc = befT[3] - 1;
                console.log("befT[3]", befT[3]);
              } else {
                (bIDar2 = i - 1 - befT[3]), (bIDar3 = i - 1 - befT[3]);
                esc = 0;
                let eR1 = evalRep(beforeCont),
                  eR2 = evalRep(befIDarr[bIDar2][2]);
                if (
                  typeof eR1 == "number" &&
                  typeof eR2 == "number" &&
                  befIDarr[bIDar2][4] != "⚠️" &&
                  String(beforeAuthor) == String(befIDarr[bIDar3][3]) //お手つきの場合
                ) {
                  console.log(
                    beforeAuthor,
                    "に対し",
                    befIDarr[bIDar3][3],
                    "のため⚠️"
                  );
                  await beforeMessage.react("⚠️");
                  return ["ERROR"];
                } else if (
                  typeof eR1 == "number" &&
                  typeof eR2 == "number" &&
                  (befIDarr[bIDar2][2] == "⚠️" || eR1 !== eR2 + 1) //入力に誤りがある場合
                ) {
                  console.log(
                    beforeCont,
                    "に対し",
                    befIDarr[bIDar2][2],
                    "のため❌"
                  );
                  await beforeMessage.react("❌");
                  return ["ERROR"];
                } else if (
                  typeof eR1 == "number" &&
                  typeof eR2 == "number" &&
                  eR1 === eR2 + 1 //問題ない場合
                ) {
                  console.log(
                    beforeCont,
                    "に対し",
                    befIDarr[bIDar2][2],
                    "のため✅"
                  );
                  await beforeMessage.react("✅");
                  if (eR1 % 100 == 0) {
                    await beforeMessage.react("💯");
                  }
                }
              }
            } catch (e) {
              console.log(e);
            }
            return [beforeMessage.id, beforeCont, beforeAuthor, esc];
          });
      }
      await callCountApi("削除", "");
      console.log("処理が終了しました");
    });
}

async function befTAinq(guild, channel, channelID, mesID) {
  let response2,
    sig = "NA";
  try {
    response2 = await channel.messages //終点を決める
      .fetch(String(mesID))
      .then(async (message) => {
        sig = "OK";
        return [sig, message];
      });
  } catch (e) {
    response2 = ["NG", e];
  }
  console.log("befTAinq", response2);
  return response2;
}

async function befTAis(channel, channelID, befTA, befIDarr) {
  let befTAinq = 0,
    befEND = 0,
    befTA00 = befTA[0];
  //さかのぼって始点を決める
  while (Number(befTA[1]) < 1 || befEND < 1) {
    if (befTAinq == 0) {
      befTA = [];
    }
    befIDarr.push(befTA);
    if (Number(befTA[1]) >= 1) {
      befEND = 1;
      continue;
    }
    befTAinq++;
    console.log("befTAinq", befTAinq);
    if (befTAinq == 1) {
      befTA = [befTA00];
    }
    befTA = await channel.messages
      .fetch({ before: befTA[0], limit: 1 })
      .then(async (messages) => {
        var beforeMessage = messages.first();
        var beforeCont = beforeMessage.content;
        var beforeAuthor = beforeMessage.author.id;
        var check = 0,
          emr = 0; //繰り上がり終了地点とその絵文字を保存するための変数
        try {
          console.log("beforeCont", beforeCont);
          const messageReacted2 = await client.channels.cache
            .get(channelID.toString()) //試験用：1180401046825209937　実用：1175754185271169044
            .messages.fetch(beforeMessage.id);
          var circleT = myPromise2q(messageReacted2).then(async function (
            emojiIs2
          ) {
            console.log("emojiIs2", emojiIs2);
            for (let j = 0; j < emojiIs2.length; j++) {
              for (let k = 0; k < emojiIs2[j][1].length; k++) {
                console.log("id", emojiIs2[j][1][k][1].id);
                if (
                  (emojiIs2 != "" && emojiIs2[j][1][k][1].id) ==
                  "1175376490389569586"
                ) {
                  console.log("BIGIN");
                  (check = 1), (emr = j);
                  break;
                }
                if (check == 1) {
                  break;
                }
              }
            }
            if (emojiIs2 != "" && emojiIs2[emr][0] == "⚠️" && check == 1) {
              //お手つきなので同じ値から。
              return [
                beforeMessage.id,
                1,
                Number(beforeCont) - 1,
                beforeAuthor,
                "⚠️",
              ];
            } else if (
              emojiIs2 != "" &&
              (emojiIs2[emr][0] == "❌" || emojiIs2[emr][0] == "🏁") &&
              check == 1
            ) {
              //アウトなので0から。
              return [beforeMessage.id, 1, 0, "", "❌or🏁"];
            } else if (
              emojiIs2 != "" &&
              emojiIs2[emr][0] == "✅" &&
              check == 1
            ) {
              //問題ないのでその次の値から。
              return [beforeMessage.id, 1, beforeCont, beforeAuthor, "✅"];
            } else if (befTAinq > 100) {
              //ふりだしに戻る。
              return [beforeMessage.id, 9, 0, ""];
            } else {
              return [beforeMessage.id, 0, beforeCont, beforeAuthor, ""];
            }
          });
        } catch (e) {
          console.log(e);
          return;
        }

        return circleT;
      });
  }

  return befIDarr;
}
function evalRep(formulaIs) {
  console.log("formulaIs", formulaIs);
  let rep = convert_to_rpn(String(formulaIs));
  console.log("rep", rep);
  let rep2 = calculate_rpn(rep);
  console.log("rep2", rep2);
  return Number(rep2);
}

function tokenize_formura(formula) {
  let fml = String(formula).match(/(\d+(?:\.\d+)?|[-+/*()])/g);
  console.log("fml", fml);
  let prts = 0;
  for (let i = 0; i < fml.length; i++) {
    if (
      (String(fml[i - 1]) == "*" || String(fml[i - 1]) == "/") &&
      (String(fml[i + 1]) == "+" || String(fml[i + 1]) == "-")
    ) {
      console.log("A");
      fml.splice(Number(i + 1), 0, ")");
      i++;
      for (let j = i - 1; j >= 0; j--) {
        if (String(fml[j]) == ")") {
          prts++;
        }
        if (String(fml[j]) == "(") {
          prts--;
        }
        console.log("prts", prts, "fml", String(fml[j]));
        if (prts == 0 && (String(fml[j]) == "(" || j == 0)) {
          fml.splice(Number(j), 0, "(");
          i++;
          break;
        }
      }
    }
    if (
      (String(fml[i - 1]) == "+" || String(fml[i - 1]) == "-") &&
      (String(fml[i + 1]) == "*" || String(fml[i + 1]) == "/")
    ) {
      console.log("B");
      fml.splice(Number(i), 0, "(");
      i++;
      for (let j = i; j < fml.length; j++) {
        if (String(fml[j]) == "(") {
          prts++;
        }
        if (String(fml[j]) == ")") {
          prts--;
        }
        console.log("prts", prts, "fml", String(fml[j]));
        if ((prts == 0 && String(fml[j]) == ")") || j == fml.length - 1) {
          fml.splice(Number(j), 0, ")");
          i++;
          j++;
          break;
        }
      }
    }
  }
  console.log("fml(補正後)", fml);
  return fml;
}

function convert_to_rpn(formula) {
  const token = tokenize_formura(formula);
  const stack = [],
    rpn = [];

  token.forEach((tok) => {
    let op;

    if (/\d(?:\.\d+)?/.test(tok)) {
      rpn.push(Number(tok));
    } else if ("+-*/".includes(tok)) {
      const top = stack[-1];
      if (top && "*/".includes(top)) {
        rpn.push(stack.pop());
      }
      stack.push(tok);
    } else if (tok == "(") {
      stack.push(tok);
    } else if (tok == ")") {
      while ((op = stack.pop())) {
        if (op == "(") {
          break;
        }
        rpn.push(op);
      }
    } else {
      throw new Error("unknown token!");
    }
  });
  while ((top = stack.pop())) {
    if (top == "(") {
      throw new Error("unbalance parentheses");
    }
    rpn.push(top);
  }
  return rpn;
}

function calculate_rpn(rpn) {
  const stack = [];
  let n1, n2;

  rpn.forEach((tok) => {
    switch (tok) {
      case "+":
        stack.push(stack.pop() + stack.pop());
        break;
      case "-":
        n1 = stack.pop();
        n2 = stack.pop();
        stack.push(n2 - n1);
        break;
      case "*":
        stack.push(stack.pop() * stack.pop());
        break;
      case "/":
        n1 = stack.pop();
        n2 = stack.pop();
        stack.push(n2 / n1);
        break;
      case " ":
        break;
      default:
        stack.push(tok);
    }
  });
  console.log("stack", stack);
  return stack.pop();
}

//追いきれない場合（100件超過）の処理
async function callCountApi(hennkou, befMesId) {
  try {
    var okuruNaiyou = {
      hennkou: hennkou,
      befMesId: befMesId,
    };
    var okuruJson = JSON.stringify(okuruNaiyou);
    const uri = String(process.env.uri3);
    const res = await fetch(uri, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: okuruJson,
    });
    const kekka = await res.json();
    const strings = await JSON.parse(JSON.stringify(kekka));
    const data = strings["結果"];
    console.log("data:", data);
    return data;
  } catch (error) {
    console.log(error);
    return [["APIエラーでは？"]];
  }
}

//VC参加
async function voiceOn(guildId, vcId, options) {
  options = JSON.parse(options);
  const guild = await client.guilds.cache.get(String(guildId));
  const channel = await client.channels.cache.get(String(vcId));
  const connection = joinVoiceChannel({
    guildId: String(guildId),
    channelId: String(vcId),
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfMute: false,
    selfDeaf: false,
  });
  /*console.log(String(options));*/
  if (String(options[0]) == "PLAY") {
    await vcOccupier("using");
    await voicePlay(guild, channel, connection, options[1]);
  }
  if (String(options[0]) == "BYE") {
    connection.destroy();
  }
}

//VC再生
async function voicePlay(guild, channel, connection, audio) {
  audio = await toBlob(audio);
  console.log("RET", typeof audio);
  console.log("T", audio);
  /*audio = createResources(audio);*/
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.play,
    },
  }); //"http://drive.google.com/uc?export=view&id= https://www.googleapis.com/drive/v3/files/"
  const resource = createAudioResource(audio, {
    inputType: StreamType.Arbitrary,
  });
  player.play(resource);
  connection.subscribe(player);
  console.log("connected");
  player.addListener("stateChange", (oldOne, newOne) => {
    if (newOne.status == "idle") {
      vcOccupier("vacancy");
      console.log("The song finished");
    }
  });
}

async function probeAndCreateResource(readableStream) {
  const { stream, type } = await demuxProbe(readableStream);
  return createAudioResource(stream, { inputType: type });
}

async function createResources(audio) {
  // Creates an audio resource with inputType = StreamType.OggOpus
  const oggStream = await probeAndCreateResource(audio);
}

async function toBlob(audio) {
  console.log("tB", typeof audio);
  /*  const stream = new Readable();
  stream.push(audio);
  stream.push(null);*/
  /*console.log("Base64:", audio);*/
  /*audio = String(audio);*/
  /*var bin = atob(String(audio).replace(/^.*,/, ''));
    var ab = new Buffer(bin.length);*/
  var buffer = Buffer.from(audio, "base64");
  /*var buffer = new Uint8Array(buffer);
    let utf8decoder = new TextDecoder();
    var buffer = utf8decoder.decode();
    /*var buffer = iconv.decode(Buffer.concat(bin), "Shift_JIS")*/ /*var buffer = new Uint8Array(ab);
    for (var i = 0; i < bin.length; i++) {
        buffer[i] = bin.charCodeAt(i);
    }*/
  try {
    var blob = new Blob([blob], {
      type: "audio/ogg; codecs=opus;base64",
    });
  } catch (e) {
    return false;
  }
  /*const newbuf = await streamToBuffer (stream);*/
  // Create the encoder.
  // Specify 48kHz sampling rate and 2 channel size.
  console.log("buffer.length:", buffer.length);
  /*var newbuf = segmentation(buffer, 1000000); /*console.log(newbuf);*/
  /**/
  fs.writeFileSync("file.ogg", buffer);
  let file = fs.readFileSync("file.ogg");
  console.log(file);
  const stream = new Readable();
  stream.push(file);
  stream.push(null);
  /*const encoder = new OpusEncoder(48000, 2);
  const encoded = encoder.encode(buffer);
  
  /*
// Encode and decode.
const encoded = encoder.encode(buffer);*/
  /*var encoded = segench(newbuf);*/

  return stream;
}

function testblob(blob) {
  var reader = new FileReader();
  reader.readAsDataURL(blob);
  reader.onloadend = () => {
    var base64data = reader.result;
    fs.writeFileSync(
      "file.ogg",
      Buffer.from(
        base64data.replace("data:audio/ogg; codecs=opus;base64,", ""),
        "base64"
      )
    );
  };
}

function segmentation(arrayBuffer, segmentSize) {
  var segments = [];
  var fi = 0;
  while (fi * segmentSize < arrayBuffer.byteLength) {
    segments.push(arrayBuffer.slice(fi * segmentSize, (fi + 1) * segmentSize));
    ++fi;
  }
  return segments;
}
function segench(buffer) {
  let encarr = [];
  for (let i = 0; i < buffer.length; i++) {
    const encoder = new OpusEncoder(48000, 2);
    const encoded = encoder.encode(buffer[i]);
    encarr.push(encoded);
  }
  return encarr;
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    let i = 0;
    stream.on("readable", () => {
      let chunck;
      while (true) {
        i++;
        chunck = stream.read();
        if (chunck == null) break;
        // Specify 48kHz sampling rate and 2 channel size.
        const encoder = new OpusEncoder(48000, 2);

        // Encode and decode.
        const encoded = encoder.encode(chunck);
      }
    });
  });
}

async function vcOccupier(type) {
  try {
    var okuruNaiyou = {
      p1: type,
    };
    var okuruJson = JSON.stringify(okuruNaiyou);
    console.log(okuruJson);
    const uri = String(process.env.uri4);
    const res = await fetch(uri, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: okuruJson,
    });
    const kekka = await res.json();
    const strings = await JSON.parse(JSON.stringify(kekka));
    const data = strings["結果"];
    console.log("data: ", data);
    return;
  } catch (error) {
    console.log(error);
    return "APIエラーでは？";
  }
}

//チャンネルに張られたメッセージリンクを✅付きのメッセージまでたどる
async function pdfToPngController(channelID) {
  const guild = client.guilds.cache.get("1071288663884959854"); //試験用：1168349939525505054　実用：1071288663884959854
  const channel = client.channels.cache.get(String(channelID));
  let message,
    text,
    lastMessage,
    beforeMessage,
    befMes = [],
    messageIs = 0,
    emojiIs,
    pdfIs = 0;
  let str, pgS, pgE, ctC, mesURLG, mesURLC, channelId, messageId, channel2;
  let res = null;

  //終点を決める
  const response2 = await channel.messages.fetch({ limit: 1 });
  lastMessage = response2.first();
  befMes.push([lastMessage.id, lastMessage.content, lastMessage]);

  for (let i = Number(messageIs); i < 10; i++) {
    let skip = 0;
    console.log("i", i);
    console.log("befMes", befMes[i]);
    messageIs = await channel.messages
      .fetch({
        before: befMes[i][0],
        limit: 1,
      })
      .then(async (messages) => {
        beforeMessage = messages.first();
        console.log("beforeMessage.id", beforeMessage.id);
        const messageReacted2 = await client.channels.cache
          .get(channelID.toString()) //試験用：1180401046825209937　実用：1175754185271169044
          .messages.fetch(befMes[i][0]);
        befMes.push([beforeMessage.id, beforeMessage.content, beforeMessage]);
        emojiIs = await myPromise2q(messageReacted2).then(async function (
          emojiIs2
        ) {
          console.log("emojiIs2", emojiIs2);
          if (emojiIs2.length > 0 && emojiIs2[0][0] == "✅") {
            console.log("emojiIs2[0][0]", emojiIs2[0][0]);
            i = 10;
            return i;
          }
          console.log("befMes[i][1]", String(befMes[i][1]));
          str = String(befMes[i][1]);
          if (str.indexOf("https://") == -1) {
            console.log("リンクなし");
            skip++;
          }
          //デフォルトはPDF全ページかつフォント優先なし。ただし誤字などは自動補正される。
          (pgS = "FR"), (pgE = "FR"), (ctC = "FALSE");
          if (
            str.indexOf(" ページ指定") != -1 ||
            str.indexOf(" フォント優先") != -1
          ) {
            if (str.indexOf(" ページ指定") != -1) {
              pgS = String(str).substring(
                str.indexOf(" ページ指定") + 6,
                str.indexOf("から")
              );
              pgE = String(str).substring(
                str.indexOf("から") + 2,
                str.indexOf("まで")
              );
            }
            if (str.indexOf(" フォント優先") != -1) {
              ctC = String(str).substring(
                str.indexOf("フォント優先") + 6,
                str.indexOf("。")
              );
              if (String(ctC) == "あり") {
                ctC = "TRUE";
              } else {
                ctC = "FALSE";
              }
            }
            mesURLG = String(str).substring(
              str.indexOf("channels/") + 9,
              str.indexOf(" ")
            );
          } else {
            mesURLG = String(str).substring(str.indexOf("channels/") + 9);
          }
          console.log("pgS?", pgS, "pgE?", pgE, "ctC?", ctC);
          str = String(mesURLG);
          console.log("str", str);
          mesURLC = String(str).substring(str.indexOf("/") + 1);
          str = String(mesURLC);
          console.log("str", str);
          channelId = String(str).substring(0, str.indexOf("/"));
          messageId = String(str).substring(str.indexOf("/") + 1);
          console.log("channelId", channelId, "messageId", messageId);
          try {
            channel2 = await client.channels.fetch(String(channelId));
          } catch (e) {
            console.warn(e);
            skip++;
          }
          console.log("ch2?", channel2);
          try {
            message = await channel2.messages.fetch(String(messageId));
          } catch (e) {
            console.warn(e);
            skip++;
          }
          console.log("mes?", message);
          try {
            if (Number(skip) == 0) {
              //空き状況の確認
              if (res == null) {
                let req = JSON.stringify({ p1: String(process.env.VOLUME2) });
                res = await fetching1(String(process.env.uri5), req);
              }
              console.log("res", res.type);
              if (String(res.type) === "OK") {
                pdfIs = pdfToPngRetriever(message, pgS, pgE, ctC, res);
              } else {
                pdfIs = "NG";
              }
            }
          } catch (e) {
            console.warn(e);
          }
          befMes[i][2].react("✅"); /*if(pdfIs == "OK"){}*/
          return;
        });
        return emojiIs;
      });
  }
}

//該当メッセージの添付ファイルを取得し、画像化して送信する
async function pdfToPngRetriever(message, pgS, pgE, ctC, res) {
  let file = null,
    pngs = null,
    mes2 = "";

  console.log(message.attachments);
  if (message.attachments == false) {
    console.log("ファイルなし");
    return;
  }

  const files = message.attachments.map((attachment) => attachment);
  const sizes = message.attachments.map((attachment) => attachment.size);
  const urls = message.attachments.map((attachment) => attachment.url);
  const ctTypes = message.attachments.map(
    (attachment) => attachment.contentType
  );
  const names = message.attachments.map((attachment) => attachment.name);
  console.log("sizes", sizes);
  console.log("urls", urls);
  console.log("ctTypes", ctTypes);
  console.log("names", names);
  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      console.log("filetype", ctTypes[i]);
      if (ctTypes[i] == "application/pdf") {
        console.log(message.url, names[i], "を処理します");
        mes2 = String(message.url) + "\n" + String(names[i]);
        /*let options = { flags: null, files: null, emojis: null };
        await sendMsgWithFrags(
          message.channel.id,
          "aaa\n" + String(urls[i]),
          options
        );*/ //テスト用
        pngs = await pdfToPngDistCanvas(names[i], urls[i], pgS, pgE, ctC, res);
        if (pngs.ans == "OK") {
          let endIs = await pdfToPngSender(message.channel.id, mes2, pngs, pgS);
          if (String(endIs) == "OK") {
            console.log("送信を完了しました");
          }
        } else {
          console.warn(message.url, pngs, "変換を中止しました");
        }
      }
    }
  } else {
    console.warn(message.url, "ファイルが見つかりません");
    return;
  } //ファイルの不在を通知
}

//上の続き。1ページごとに画像化し、ファイル名を付す
async function pdfToPngDistCanvas(name, file, pgS, pgE, ctC, res) {
  let array = [];
  console.log("A");

  //urlをフェッチ
  const fileIs2 = await fetch(file).then(async function (fileIs) {
    console.log(typeof fileIs, fileIs);
    const fileTxt2 = await fileIs.arrayBuffer().then(async function (fileTxt) {
      console.log("status", fileIs.status, fileTxt);
      let res2;
      const buffer1 = Buffer.from(fileTxt);
      const bs64 = buffer1.toString("base64");
      /*let fileOn = new formdata();
        fileOn.append("type", "convertPdfToPngs");
        fileOn.append("VOLUME1", String(process.env.VOLUME1));
        fileOn.append("title", String(res.answer));
        fileOn.append("pdfTitle", String(name));
        fileOn.append("pdf", buffer1, {
          filename: "file.pdf",
          contentType: "application/pdf",
        });*/
      let fileOn = {
        type: "convertPdfToPngs",
        VOLUME1: String(process.env.VOLUME1),
        title: String(res.answer),
        pdfTitle: String(name),
        pdf: String(bs64),
        pgS: String(pgS),
        pgE: String(pgE),
        ctC: String(ctC),
      };
      let req2 = JSON.stringify(fileOn);

      res2 = await fetching2(String(process.env.uri6), req2); //formdataで送るならstringify不要
      console.log("res2", res2);
      console.log("res2-ans", res2.ans);
      if (res2.ans == "OK") {
        return res2;
      } else {
        return "NG";
      }
      //pdfを一時保存
      /*const buffer = Buffer.from(fileTxt);
      fs.writeFileSync("file.pdf", buffer, "buffer", (err) => {
        if (err) {
          console.warn(err);
        } else {
          console.log("pdfを一時保存しました。");
        }
      });
      let file = fs.readFileSync("file.pdf");
      console.log("file", file);
      const pdfData = new Uint8Array(file);
      const pdfIs2 = "";
      return pdfIs2;*/
    });
    return fileTxt2;
  });
  return fileIs2;
}

//上の続き。空き状況を確認する
async function fetching1(uri, okuruJson) {
  try {
    /*console.log(okuruJson);*/
    const res = await fetch(uri, {
      method: "post",
      headers: { "Content-Type": "application/json" },
      body: okuruJson,
    });
    const kekka = await res.json();
    const strings = await JSON.parse(JSON.stringify(kekka));
    const data = strings["結果"];
    /*console.log("data: ", data);*/
    return data;
  } catch (error) {
    console.log(error);
    return "APIエラーでは？";
  }
}

//上の続き。画像に変換してくる
async function fetching2(uri, data) {
  let cargo = {
    method: "post",
    headers: { "Content-Type": "application/json" },
    body: data,
  };
  let res = await fetch(uri, cargo);
  const kekka = await res.json();
  const strings = await JSON.parse(JSON.stringify(kekka));
  console.log(strings);
  return strings;
}

//上の続き。6ページごとに送信する
async function pdfToPngSender(channelId, mes, pngJ) {
  let pngArray = [],
    page = Number(pngJ.pgS) - 1,
    page2 = Number(pngJ.pgS),
    name = "",
    mes2 = "",
    comIs = "";
  let pngs = JSON.parse(pngJ.pngs),
    comment = pngJ.comment;

  console.log("pngs", typeof pngs, pngs.length);
  for (let i = 0; i < pngs.length; i++) {
    page++;
    name = String(pngs[i][0]);
    const bufferIs = Buffer.from(String(pngs[i][1]), "base64");
    const attachment = new AttachmentBuilder(bufferIs, { name: String(name) });
    pngArray.push(attachment);
    if (
      Number(i) == pngs.length - 1 &&
      String(comment) == "Specify pdf pages under 49pcs."
    ) {
      comIs =
        " \n【重要】49ページを超えるPDFは一度には処理できません。49ページを超えるPDFを画像化したい場合は、ページ指定をしてください";
    }
    if ((Number(i) + 1) % 6 == 0 || Number(i) == pngs.length - 1) {
      mes2 =
        mes +
        " " +
        String(Number(page2)) +
        "～" +
        String(Number(page)) +
        "ページ目" +
        String(comIs);
      let options = { flags: null, files: pngArray, emojis: null };
      /*fs.writeFileSync(String(name), bufferIs);*/ //テスト用
      await sendMsgWithFrags(channelId, mes2, options);
      page2 = Number(page) + 1;
      mes2 = "";
      pngArray = [];
    }
  }
  return "OK";
}

//webhookでの送信
async function webhook1(settings) {
  console.log(settings.webhookId);
  const webhookClient = new WebhookClient({
    id: String(settings.webhookId),
    token: String(settings.webhookToken),
  });

  let embeds = null,
    avatarURL = null,
    flags = null,
    files = null;

  if (settings.embedIs == "true") {
    embeds = new EmbedBuilder()
      .setTitle(String(settings.title))
      .setColor(String(settings.color));
    embeds = [embeds];
  }
  if (settings.avatarURL != "") {
    avatarURL = String(settings.avatarURL);
  }
  if (settings.flags != "") {
    flags = [Number(settings.flags)];
  }
  if (settings.files != "") {
    files = [String(settings.files)];
  }
  let text = String(settings.content),
    option = { embeds, flags, files };

  webhookClient
    .send({
      content: String(settings.content),
      username: String(settings.username),
      avatarURL: avatarURL,
      embeds: embeds,
      flags: flags,
      files: files,
    })
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

//メッセージ送信
async function sendMsg(channelId, text, option = {}) {
  console.log("aaaaaaa", channelId, text);
  client.channels.cache
    .get(channelId)
    .send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}

//メッセージ送信
async function sendMsgWithFrags(channelId, text, options) {
  try {
    let flags = options.flags,
      files = options.files,
      emojis = options.emojis;
    let option = { flags, files };
    console.log("bbbbbbb", channelId, text, options);
    let sentMes = await client.channels.cache
      .get(channelId)
      .send({ content: text, flags: flags, files: files })
      .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
      .catch(console.error);
    if (emojis != null && emojis.length > 0) {
      for (let i = 0; i < emojis.length; i++) {
        if (String(emojis[i]) != "") {
          sentMes.react(String(emojis[i]));
        }
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

function sendDm(userId, text, option = {}) {
  client.users
    .fetch(userId)
    .then((e) => {
      e.send(text, option)
        .then(console.log("DM送信: " + text + JSON.stringify(option)))
        .catch(console.error); // 1段階目のエラー出力
    })
    .catch(console.error); // 2段階目のエラー出力
}
