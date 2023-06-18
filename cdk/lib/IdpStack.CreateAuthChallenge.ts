import * as nodeCrypto from "node:crypto";

// ユーザのカスタム属性'custom:publicKeyCred'に格納されている公開鍵情報を取得する
exports.handler = async (event: any) => {
  console.log(JSON.stringify(event));

  const publicKeyCredBase64 =
    event.request.userAttributes["custom:publicKeyCred"];
  const publicKeyCredJSON = Buffer.from(publicKeyCredBase64, "base64").toString(
    "ascii"
  );
  console.log(publicKeyCredJSON);
  const publicKeyCred = JSON.parse(publicKeyCredJSON);

  const challenge = nodeCrypto.randomBytes(64).toString("hex");

  event.response.publicChallengeParameters = {
    credId: publicKeyCred.id, //credetnial id
    challenge: challenge,
  };

  event.response.privateChallengeParameters = { challenge: challenge };
  console.log(
    "privateChallengeParameters=" + event.response.privateChallengeParameters
  );

  return event;
};
