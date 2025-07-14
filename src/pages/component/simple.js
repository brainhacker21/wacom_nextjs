import { useEffect, useRef, useState } from "react";
import styles from "../../styles/Simple.module.css";
import dynamic from "next/dynamic";

const CanvasDraw = dynamic(() => import("react-canvas-draw"), {
  ssr: false,
});

export default function SimpleDemoPage({
  signersData,
  signatureImages,
  onSignatureUpdate,
  setIsStuAvailable,
  setButtonsDisabled,
  buttonsDisabled,
  sdkInstances,
}) {
  const wrapperRefs = useRef([]);

  const saveInlineCanvas = (signerIndex) => {
    const wrapperDiv = wrapperRefs.current[signerIndex];
    if (!wrapperDiv) return;
    const canvasElement = wrapperDiv.querySelector("canvas:nth-of-type(2)");
    if (canvasElement) {
      const image = canvasElement.toDataURL("image/png");
      onSignatureUpdate(signerIndex, image); // Melapor ke parent
    }
  };

  const clearSignature = (signerIndex) => {
    onSignatureUpdate(signerIndex, null); // Melapor ke parent
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
        setButtonsDisabled(false);
      } catch (error) {
        console.error("SDK Initialization Failed:", error);
        alert("SDK Initialization Failed: " + error.message);
      }
    };
    initializeDemo();
  }, []);

  const renderAndSaveSignature = async (signerIndex) => {
    const { mSigObj } = sdkInstances.current;
    try {
      const image = await mSigObj.renderBitmap(
        343,
        250,
        "image/png",
        4,
        "#000000",
        "transparent",
        0,
        0,
        0
      );
      onSignatureUpdate(signerIndex, image);
      await resetSdkObject();
    } catch (e) {
      console.error("Error rendering signature:", e);
    }
  };

  const captureFromCanvas = async (signerIndex) => {
    try {
      const { default: SigCaptDialog } = await import(
        "../../lib/sigCaptDialog/sigCaptDialog.js"
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
    }
  };

  return (
    <div className={styles.signaturesGrid}>
      {signersData.map((signerInfo, index) => {
        const sigImage = signatureImages[index];
        return (
          <div key={index} className={styles.signatureCard}>
            <div className={styles.signatureContentWrapper}>
              <div className={styles.signerInfo}>
                <span className={styles.signerType}>{signerInfo.type}</span>
                <span className={styles.signerName}>{signerInfo.name}</span>
              </div>
              <div className={styles.signatureBox}>
                {sigImage ? (
                  <img
                    src={sigImage}
                    alt={`Signature of ${signerInfo.name}`}
                    className={styles.signatureImage}
                  />
                ) : (
                  <div
                    ref={(el) => (wrapperRefs.current[index] = el)}
                    className={styles.inlineCanvasWrapper}
                    onMouseUp={() => saveInlineCanvas(index)}
                    onTouchEnd={() => saveInlineCanvas(index)}
                  >
                    <CanvasDraw
                      lazyRadius={0}
                      brushRadius={2}
                      canvasWidth={343}
                      canvasHeight={250}
                      hideGrid
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={styles.buttonGroup}>
              {sigImage ? (
                <button
                  onClick={() => clearSignature(index)}
                  className={`${styles.button} ${styles.buttonDanger}`}
                >
                  Hapus
                </button>
              ) : (
                <>
                  <button
                    onClick={() => captureFromCanvas(index)}
                    disabled={buttonsDisabled}
                    className={`${styles.button} ${styles.buttonPrimary}`}
                  >
                    Canvas
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
