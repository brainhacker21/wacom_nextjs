import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import styles from "../styles/Simple.module.css";
import dynamic from "next/dynamic";

const CanvasDraw = dynamic(() => import("react-canvas-draw"), {
  ssr: false,
});

const signersData = {
  data: [
    { type: "owner", name: "Auric" },
    { type: "secondary", name: "test123" },
  ],
};

export default function SimpleDemoPage() {
  const [signatures, setSignatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const [isStuAvailable, setIsStuAvailable] = useState(false);
  const sdkInstances = useRef({});
  const wrapperRefs = useRef([]);

  const saveInlineCanvas = (signerIndex) => {
    const wrapperDiv = wrapperRefs.current[signerIndex];
    if (!wrapperDiv) return;
    const canvasElement = wrapperDiv.querySelector("canvas:nth-of-type(2)");
    if (canvasElement) {
      const image = canvasElement.toDataURL("image/png");
      setSignatures((prevSignatures) =>
        prevSignatures.map((sig, index) =>
          index === signerIndex ? { ...sig, sigImage: image } : sig
        )
      );
    } else {
      console.error("Elemen canvas untuk sign not found.");
    }
  };

  const resetSdkObject = async () => {
    const { sigSDK } = sdkInstances.current;
    if (sigSDK) {
      const newSigObj = new sigSDK.SigObj();
      await newSigObj.setLicence(
        "20541788-6683-4402-b943-2b6b34967d60",
        "OkzWwmfVv4pBfSJRFDWLiFieHxBHFhEiHCovt80ry5G+F7JzKVQtZweecqJ/lvFjODpNhc5SSHNC/nv2VmXgug=="
      );
      sdkInstances.current.mSigObj = newSigObj;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && navigator.hid) {
      setIsStuAvailable(true);
    }
    const initializeDemo = async () => {
      try {
        const { default: SigSDK } = await import("javascript-signature-sdk");
        const sigSDK = await new SigSDK({
          locateFile: () => "/signature-sdk.wasm",
        });
        sdkInstances.current.sigSDK = sigSDK;
        await resetSdkObject();
        const initialSignatures = signersData.data.map((signer) => ({
          ...signer,
          sigImage: null,
          canvasKey: 1,
        }));
        setSignatures(initialSignatures);
        setButtonsDisabled(false);
      } catch (error) {
        console.error("SDK Initialization Failed:", error);
        alert("SDK Initialization Failed: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    initializeDemo();
  }, []);

  const renderAndSaveSignature = async (signerIndex) => {
    const { mSigObj } = sdkInstances.current;
    try {
      const image = await mSigObj.renderBitmap(
        300,
        150,
        "image/png",
        4,
        "#000000",
        "transparent",
        0,
        0,
        0
      );
      setSignatures((prevSignatures) =>
        prevSignatures.map((sig, index) =>
          index === signerIndex ? { ...sig, sigImage: image } : sig
        )
      );
      await resetSdkObject();
    } catch (e) {
      console.error("Error rendering signature:", e);
      alert("Error rendering signature: " + e.message);
    }
  };

  const captureFromCanvas = async (signerIndex) => {
    try {
      const { default: SigCaptDialog } = await import(
        "../lib/sigCaptDialog/sigCaptDialog.js"
      );
      const { sigSDK, mSigObj } = sdkInstances.current;
      const sigCaptDialog = new SigCaptDialog(sigSDK, {});
      sigCaptDialog.addEventListener("ok", () =>
        renderAndSaveSignature(signerIndex)
      );
      await sigCaptDialog.open(
        mSigObj,
        "Customer",
        " ",
        null,
        sigSDK.KeyType.SHA512,
        null
      );
      sigCaptDialog.startCapture();
    } catch (error) {
      console.error("Failed to open canvas capture dialog:", error);
      alert("Failed to open canvas capture dialog: " + error.message);
    }
  };

  const captureFromSTU = async (signerIndex) => {
    try {
      const { default: StuCaptDialog } = await import(
        "../lib/sigCaptDialog/stuCaptDialog.js"
      );
      const { sigSDK, mSigObj } = sdkInstances.current;
      const stuCapDialog = new StuCaptDialog(sigSDK);
      stuCapDialog.addEventListener("ok", () =>
        renderAndSaveSignature(signerIndex)
      );
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

  const clearSignature = (signerIndex) => {
    setSignatures((prevSignatures) =>
      prevSignatures.map((sig, index) =>
        index === signerIndex ? { ...sig, sigImage: null } : sig
      )
    );
  };

  const handleSubmit = () => {
    const formattedData = signatures.map((signer) => ({
      signName: signer.name,
      signType: signer.type,
      sign: signer?.sigImage?.split(",")[1],
    }));
    console.log(formattedData);
  };

  return (
    <>
      <Head>
        <title>Signature SDK - Dynamic Demo</title>
      </Head>
      {/* {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingBox}>
            <div className={styles.loadingSpinner}></div>
            <span className={styles.loadingText}>Initializing SDK...</span>
          </div>
        </div>
      )} */}
      <main className={styles.pageContainer}>
        <div className={styles.card}>
          {isStuAvailable && (
            <button
              onClick={() => captureFromSTU()}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              STU
            </button>
          )}
          <div className={styles.signaturesGrid}>
            {signatures.map((signer, index) => (
              <div key={index} className={styles.signatureCard}>
                {/* Bagian atas: Info dan area tanda tangan */}
                <div className={styles.signatureContentWrapper}>
                  <div className={styles.signerInfo}>
                    <span className={styles.signerType}>{signer.type}</span>
                    <span className={styles.signerName}>{signer.name}</span>
                  </div>
                  <div className={styles.signatureBox}>
                    {signer.sigImage ? (
                      <div className={styles.signatureContent}>
                        <img
                          src={signer.sigImage}
                          alt={`Signature of ${signer.name}`}
                          className={styles.signatureImage}
                        />
                      </div>
                    ) : (
                      <div
                        ref={(el) => (wrapperRefs.current[index] = el)}
                        className={styles.inlineCanvasWrapper}
                        onMouseUp={() => saveInlineCanvas(index)}
                        onTouchEnd={() => saveInlineCanvas(index)}
                      >
                        <CanvasDraw
                          brushRadius={2}
                          brushColor="#000"
                          lazyRadius={0}
                          canvasWidth={343}
                          canvasHeight={250}
                          hideGrid={true}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bagian bawah: Tombol Aksi */}
                <div className={styles.buttonGroup}>
                  {signer.sigImage ? (
                    <button
                      onClick={() => clearSignature(index)}
                      className={`${styles.button} ${styles.buttonDanger}`}
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      onClick={() => captureFromCanvas(index)}
                      disabled={buttonsDisabled}
                      className={`${styles.button} ${styles.buttonPrimary}`}
                    >
                      Tanda Tangan di Canvas
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            className={`${styles.button} ${styles.buttonSubmit}`}
          >
            Lihat Hasil di Console
          </button>
        </div>
      </main>
    </>
  );
}
