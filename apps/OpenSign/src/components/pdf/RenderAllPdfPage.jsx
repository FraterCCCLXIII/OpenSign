import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import {
  base64ToArrayBuffer,
  decryptPdf,
  getFileAsArrayBuffer
} from "../../constant/Utils";
import { maxFileSize } from "../../constant/const";
import {
  clearAcroFields,
  isPdfPasswordProtected
} from "../../utils/acroFieldExtractor";

function RenderAllPdfPage(props) {
  const { t } = useTranslation();
  const pageContainer = useRef();
  const thumbListRef = useRef(null);
  const mergePdfInputRef = useRef(null);
  const [signPageNumber, setSignPageNumber] = useState([]);
  const [bookmarkColor, setBookmarkColor] = useState("");
  const [pageWidth, setPageWidth] = useState(0);

  //set all number of pages after load pdf
  function onDocumentLoad({ numPages }) {
    props?.setAllPages(numPages);
    //check if signerPos array exist then save page number exist in signerPos array to show bookmark icon
    if (props?.signerPos) {
      const checkUser = props?.signerPos.filter(
        (data) => data.Id === props?.id
      );
      setBookmarkColor(checkUser[0]?.blockColor);
      let pageNumberArr = [];
      if (checkUser?.length > 0) {
        checkUser[0]?.placeHolder?.map((data) => {
          pageNumberArr.push(data?.pageNumber);
        });

        setSignPageNumber(pageNumberArr);
      }
    }
  }

  // Keep thumbnail width in sync with the left rail (sidebar / window resize)
  useEffect(() => {
    const listEl = thumbListRef.current;
    if (!listEl) return;

    const updateSize = () => {
      const nextWidth = Math.floor(listEl.clientWidth);
      setPageWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(listEl);

    return () => observer.disconnect();
  }, [props?.containerWH?.width]);
  //'function `addSignatureBookmark` is used to display the page where the user's signature is located.
  const addSignatureBookmark = (index) => {
    const ispageNumber = signPageNumber.includes(index + 1);
    return (
      ispageNumber && (
        <div className="absolute z-20 top-[1px] -right-[13px] -translate-x-1/2 -translate-y-1/2">
          <i
            style={{ color: bookmarkColor || "red" }}
            className="fa-solid fa-bookmark"
          ></i>
        </div>
      )
    );
  };
  const pdfDataBase64 = `data:application/pdf;base64,${props?.pdfBase64Url}`;

  // `removeFile` is used to  remove file if exists
  const removeFile = (e) => {
    if (e) {
      e.target.value = "";
    }
  };
  // `handleFileUpload` is trigger when user click on add pages btn and is used to merge multiple pdf
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      alert(t("please-select-pdf"));
      return;
    }
    if (!file.type.includes("pdf")) {
      alert(t("only-pdf-allowed"));
      return;
    }
    const fileSize =
      maxFileSize;
    const pdfsize = file?.size;
    const fileSizeBytes = fileSize * 1024 * 1024;
    if (pdfsize > fileSizeBytes) {
      alert(`${t("file-alert-1")} ${fileSize} MB`);
      removeFile(e);
      return;
    }
    try {
      let uploadedPdfBytes = await getFileAsArrayBuffer(file);
      await isPdfPasswordProtected(uploadedPdfBytes);
      try {
        uploadedPdfBytes = await clearAcroFields(uploadedPdfBytes); // best effort cleanup to prevent stale data
      } catch (error) {
        console.error("Error merging PDF:", error);
        if (error?.message?.includes("is encrypted")) {
          try {
            const pdfFile = await decryptPdf(file, "");
            const pdfArrayBuffer = await getFileAsArrayBuffer(pdfFile);
            uploadedPdfBytes = await clearAcroFields(pdfArrayBuffer);
          } catch (err) {
            if (err?.response?.status === 401) {
              const password = prompt(
                `PDF "${file.name}" is password-protected. Enter password:`
              );
              if (password) {
                try {
                  const pdfFile = await decryptPdf(file, password);
                  const pdfArrayBuffer = await getFileAsArrayBuffer(pdfFile);
                  uploadedPdfBytes = await clearAcroFields(pdfArrayBuffer);
                  // Upload the file to Parse Server
                } catch (err) {
                  console.error("Incorrect password or decryption failed", err);
                  alert(t("incorrect-password-or-decryption-failed"));
                  return;
                }
              } else {
                alert(t("provide-password"));
                return;
              }
            } else {
              console.error("Decryption error ", error);
              alert(t("error-uploading-pdf"));
              return;
            }
          }
        } else {
          console.error("File upload error ", error);
          alert(t("error-uploading-pdf"));
          return;
        }
      }
      const uploadedPdfDoc = await PDFDocument.load(uploadedPdfBytes, {
        ignoreEncryption: true
      });
      const basePdfDoc = await PDFDocument.load(props.pdfArrayBuffer);

      // Copy pages from the uploaded PDF to the base PDF
      const uploadedPdfPages = await basePdfDoc.copyPages(
        uploadedPdfDoc,
        uploadedPdfDoc.getPageIndices()
      );
      uploadedPdfPages.forEach((page) => basePdfDoc.addPage(page));
      // Save the updated PDF
      const pdfBase64 = await basePdfDoc.saveAsBase64({
        useObjectStreams: false
      });
      const pdfBuffer = base64ToArrayBuffer(pdfBase64);
      const pdfsize = pdfBuffer?.byteLength;
      const fileSizeBytes = fileSize * 1024 * 1024;
      if (pdfsize > fileSizeBytes) {
        alert(`${t("file-alert-1")} ${fileSize} MB`);
        removeFile(e);
        return;
      }
      props.setPdfArrayBuffer(pdfBuffer);
      props.setPdfBase64Url(pdfBase64);
      props.setIsUploadPdf && props.setIsUploadPdf(true);
      mergePdfInputRef.current.value = "";
    } catch (error) {
      mergePdfInputRef.current.value = "";
      console.error("Error merging PDF:", error);
    }
  };
  return (
    <div
      ref={pageContainer}
      className="hidden w-[20%] min-w-0 bg-base-100 md:flex md:flex-col self-stretch min-h-0 overflow-hidden border-r border-base-300"
    >
      <div className="px-3 py-2.5 text-sm text-base-content font-semibold shrink-0 tracking-tight">
        {t("pages")}
      </div>
      <div className="flex flex-1 min-h-0 flex-col items-center overflow-y-auto hide-scrollbar p-3">
        <div ref={thumbListRef} className="w-full min-w-0">
          <Document
            error=""
            loading={t("loading-doc")}
            onLoadSuccess={onDocumentLoad}
            file={pdfDataBase64}
          >
            {pageWidth > 0 &&
              Array.from(new Array(props?.allPages), (el, index) => (
                <div
                  key={index}
                  className={`${
                    props?.pageNumber - 1 === index
                      ? "ring-2 ring-primary border-transparent"
                      : "border-base-300 hover:border-base-content/40"
                  } w-full border rounded-md overflow-hidden flex justify-center items-center relative cursor-pointer bg-base-100 shadow-sm transition-colors mb-2.5`}
                  onClick={() => {
                    props?.setPageNumber(index + 1);
                    if (props?.setSignBtnPosition) {
                      props?.setSignBtnPosition([]);
                    }
                  }}
                >
                  {props?.signerPos && addSignatureBookmark(index)}
                  <Page
                    key={`page_${index + 1}_${pageWidth}`}
                    pageNumber={index + 1}
                    width={pageWidth}
                    scale={1}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    className="max-w-full"
                  />
                </div>
              ))}
          </Document>
          {props?.isMergePdfBtn && (
            <button
              className="mb-2 w-full op-btn op-btn-outline op-btn-sm"
              onClick={() => mergePdfInputRef.current.click()}
              title={t("add-pages")}
            >
              <input
                type="file"
                className="hidden"
                accept="application/pdf"
                ref={mergePdfInputRef}
                onChange={handleFileUpload}
              />
              <i className="fa-light fa-plus text-sm"></i>
              <span className="text-xs">{t("add-pages")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RenderAllPdfPage;
