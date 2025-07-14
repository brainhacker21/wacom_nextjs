import { useRef, useState } from "react";
import SimpleDemoPage from "./component/simple"; // Sesuaikan path jika perlu
import styles from "../styles/Simple.module.css";

const initialSignersData = {
  data: [
    { type: "owner", name: "Auric" },
    { type: "secondary", name: "test123" },
  ],
};

export default function SignatureContainer() {
  const [signatureImages, setSignatureImages] = useState(
    Array(initialSignersData.data.length).fill(null)
  );
  const [isStuAvailable, setIsStuAvailable] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const sdkInstances = useRef({});

  const handleSignatureUpdate = (signerIndex, newImage) => {
    setSignatureImages((prevImages) =>
      prevImages.map((image, index) =>
        index === signerIndex ? newImage : image
      )
    );
  };

  const captureFromSTU = async () => {
    try {
      const { default: StuCaptDialog } = await import(
        "../lib/sigCaptDialog/stuCaptDialog.js"
      );
      const { sigSDK, mSigObj } = sdkInstances.current;
      const stuCapDialog = new StuCaptDialog(sigSDK);
      stuCapDialog.addEventListener("ok", () => renderAndSaveSignature());
      await stuCapDialog.open(
        mSigObj,
        "Customer",
        " ",
        null,
        sigSDK.KeyType.SHA512,
        null
      );
    } catch (error) {
      console.error("Failed to open STU capture dialog:", error);
    }
  };

  const handleSubmit = () => {
    const finalPayload = initialSignersData.data.map((signerInfo, index) => {
      const signatureImage = signatureImages[index];
      return {
        type: signerInfo.type,
        name: signerInfo.name,
        signature: signatureImage ? signatureImage.split(",")[1] : null,
      };
    });

    console.log(finalPayload);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        {isStuAvailable && (
          <button
            onClick={() => captureFromSTU()}
            disabled={buttonsDisabled}
            className={`${styles.button} ${styles.buttonSecondary}`}
          >
            STU
          </button>
        )}
        <SimpleDemoPage
          signersData={initialSignersData.data}
          signatureImages={signatureImages}
          onSignatureUpdate={handleSignatureUpdate}
          setIsStuAvailable={setIsStuAvailable}
          setButtonsDisabled={setButtonsDisabled}
          buttonsDisabled={buttonsDisabled}
          sdkInstances={sdkInstances}
        />
        <button
          onClick={handleSubmit}
          className={`${styles.button} ${styles.buttonSubmit}`}
          style={{ marginTop: "20px" }}
        >
          Submit Dokumen
        </button>
      </div>
    </div>
  );
}
