import { RegistrationResponseRequestSchema } from "../functions/api/[[routes]]";

export const base64url = {
  encode: function (buffer: ArrayBuffer) {
    const base64 = window.btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  },
  decode: function (base64url: string) {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const binStr = window.atob(base64);
    const bin = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bin[i] = binStr.charCodeAt(i);
    }
    return bin.buffer;
  },
};

export const decodeServerOptions = (
  rawOptions: any
): PublicKeyCredentialCreationOptions => {
  // TODO: Add an ability to create a passkey: Create a credential.
  // Base64URL decode some values.
  console.log(rawOptions);
  const user = {
    ...rawOptions.user,
    id: base64url.decode(rawOptions.user.id),
  };
  const challenge = base64url.decode(rawOptions.challenge);

  for (let cred of rawOptions.excludeCredentials) {
    cred.id = base64url.decode(cred.id);
  }

  const authenticatorSelection = {
    authenticatorAttachment: "platform",
    requireResidentKey: true,
  } as const;

  return {
    challenge,
    pubKeyCredParams: rawOptions.pubKeyCredParams,
    rp: { name: rawOptions.rp.name },
    user,
    authenticatorSelection,
  };
};

export const encodeCredential = (
  publicKeyCred: PublicKeyCredential
): RegistrationResponseRequestSchema => {
  // Base64URL encode some values.
  const response = publicKeyCred.response as AuthenticatorAttestationResponse;
  const clientDataJSON = base64url.encode(response.clientDataJSON);
  const attestationObject = base64url.encode(response.attestationObject);

  return {
    id: publicKeyCred.id,
    rawId: publicKeyCred.id,
    type: publicKeyCred.type,
    response: {
      clientDataJSON,
      attestationObject,
      transports: response?.getTransports() ?? [],
    },
  };
};
