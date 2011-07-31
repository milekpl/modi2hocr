cscript modi2hocr.js %1 %2 %2.hocr
java -Xmx512m -jar hocrtopdf-0.0.1.jar %2.hocr %2.pdf
