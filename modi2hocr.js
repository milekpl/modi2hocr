/**
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 * Copyright 2011
 * @author Marcin Mi³kowski <http://marcinmilkowski.pl>
 */

function encodehtml(s) {
	return s.replace(/</g, "&gt;").replace(/>/g,"&lt");
}

var fileName;
var language;
var outputFile;
var startPage = 1;
var endPage = -1;
var orientPage = true;
var deskew = true;
if (WScript.Arguments.length >= 3) {
 language = WScript.Arguments.Item(0);
 fileName = WScript.Arguments.Item(1);
 outputFile = WScript.Arguments.Item(2);
 if (WScript.Arguments.length > 3) {
	startPage = WScript.Arguments.Item(3);
	}
  if (WScript.Arguments.length > 4) {
	endPage = WScript.Arguments.Item(4);
	}		
  if (WScript.Arguments.length > 5) {
	orientPage = WScript.Arguments.Item(5);
	}		
 if (WScript.Arguments.length > 6) {
	deskew = WScript.Arguments.Item(6);
	}		
} else {
 WScript.Echo("Usage: modi2hocr.js <language> <input file> <output file>");
 WScript.Echo("<input file> must be TIFF or MDI. The <output file> is hocr-formatted html file.");
 WScript.Echo("Optionally you may give first page and last page that you want to OCR.");
 /* miLANG_CHINESE_SIMPLIFIED (2052, &H804) 
miLANG_CHINESE_TRADITIONAL (1028, &H404) 
miLANG_CZECH (5) 
miLANG_DANISH (6) 
miLANG_DUTCH (19, &H13) 
miLANG_ENGLISH (9) 
miLANG_FINNISH (11) 
miLANG_FRENCH (12) 
miLANG_GERMAN (7) 
miLANG_GREEK (8) 
miLANG_HUNGARIAN (14) 
miLANG_ITALIAN (16, &H10) 
miLANG_JAPANESE (17, &H11) 
miLANG_KOREAN (18, &H12) 
miLANG_NORWEGIAN (20, &H14) 
miLANG_POLISH (21, &H15) 
miLANG_PORTUGUESE (22, &H16) 
miLANG_RUSSIAN (25, &H19) 
miLANG_SPANISH (10) 
miLANG_SWEDISH (29, &H1D) 
miLANG_SYSDEFAULT (2048, &H800) 
miLANG_TURKISH (31, &H1F) 
*/
 WScript.Echo("Language codes: ");
 WScript.Echo("Chinese Simplified = 2052");
 WScript.Echo("Czech = 5");
 WScript.Echo("Danish = 6");
 WScript.Echo("Dutch = 19");
 WScript.Echo("Finnish = 11");
 WScript.Echo("French = 12");
 WScript.Echo("German = 7");
 WScript.Echo("Greek = 8");
 WScript.Echo("Hungarian = 14");
 WScript.Echo("Italian = 16");
 WScript.Echo("Japanese = 17");
 WScript.Echo("Korean = 18");
 WScript.Echo("Norwegian = 20");
 WScript.Echo("Polish = 21");
 WScript.Echo("Portuguese = 22");
 WScript.Echo("Russian = 25");
 WScript.Echo("Spanish = 10");
 WScript.Echo("Swedish = 29");
 WScript.Echo("Turkish = 31");
 WScript.Echo("default system language = 2048");
 WScript.Quit(-1);
}

var modi = WScript.CreateObject("MODI.Document");
modi.Create(fileName);
if (fileName!="") {
	// var WshShell = WScript.CreateObject("WScript.Shell");
	var fso = WScript.CreateObject("Scripting.FileSystemObject");
	var hOCR = fso.CreateTextFile(outputFile);
	hOCR.WriteLine('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">');
	hOCR.WriteLine('<html xmlns="http://www.w3.org/1999/xhtml">');
	hOCR.WriteLine('<head>');
	hOCR.WriteLine('<meta http-equiv="Content-Type" content="text/html; charset=windows-1250" />');
	hOCR.WriteLine("<meta name='ocr-system' content='Microsoft Office Document Imaging'>");
	hOCR.WriteLine("</head>");
	hOCR.WriteLine("<body>");
	if (endPage == -1) {
		endPage = modi.Images.Count;
		}		
	var scanned = false;
	for (i = startPage - 1; i <endPage; i++) {		
		var nul = null;
		try {
			wordCount = modi.Images.Item(i).Layout.NumWords;
		} catch(e) {
			wordCount = -1;
		}
		if (wordCount == -1) {
			WScript.Echo("Scanning page: " + (i + 1) + "/" + endPage);
			while (wordCount == -1) {
				try { //MODI crashes and fails a lot...
					var image = modi.Images.Item(i).OCR(language, orientPage, deskew);			
					wordCount = modi.Images.Item(i).Layout.NumWords;
					modi.Save();
				} catch(e) {
				WScript.Echo("Error on page " + (i +1) + ": " + e.message);
				if (e.message == "EP_E_DCOM_OCR_FAILRECOG") {
						WScript.Echo("This page is empty.");
						wordCount = 0;
					}
				}
			}
			scanned = true;
		} else {
			WScript.Echo("Retrieving OCR text for page: " + (i + 1) + "/" + endPage);					
		}
		if (wordCount > 0) {
		var rectCount = modi.Images.Item(i).Layout.Words(wordCount - 1).Rects.Count;	
		var lastRect = modi.Images.Item(i).Layout.Words(wordCount - 1).Rects.Item(rectCount - 1);
		hOCR.WriteLine('<div class="ocr_page" title="image ' + fileName + '; bbox 0 0 ' 
		+ modi.Images.Item(i).PixelWidth + ' ' + modi.Images.Item(i).PixelHeight + '">');	
		var prevLineId = -1;
		var myLineId = -1;
		// have to use the string, LineId sometimes returns only 0 for all text...	
		var lines = modi.Images.Item(i).Layout.Text.split("\n"); 		
		j = 0;
		var wdCounter = 0;
		var this_line;
		while (j < wordCount) {	
			var curWord = modi.Images.Item(i).Layout.Words.Item(j);
			// myLineId = curWord.LineId; DOESN'T work for some reason... 
			if (j >= wdCounter) {			
				if (myLineId +1 < lines.length) {
					myLineId++;
					this_line = lines[myLineId].split(" ");
					wdCounter = wdCounter + this_line.length;
				} else {
					break;
				}
			}			
			hOCR.Write("<p><span class='ocr_line' ");	
			hOCR.Write("id='line" + myLineId + "' ");
			//calculate the bounding box for the line: get the left top  word and the last word bottom right coordinate
			//the last word has to have the same lineId...
			var firstWordRects = curWord.Rects.Item(0);	
			if (wdCounter > wordCount) {
				wdCounter = wordCount - 1;
			}
			var lastWord = j;
			if (wdCounter - 1 > lastWord) {
				lastWord = wdCounter - 1;
			}
			var lastWordRectCount = modi.Images.Item(i).Layout.Words(lastWord).Rects.Count;
			var lastWordRects = modi.Images.Item(i).Layout.Words(lastWord).Rects.Item(lastWordRectCount - 1);
			var minLeft = firstWordRects.Left;
			var minTop = firstWordRects.Top;
			var maxRight = lastWordRects.Right;
			var maxBottom = lastWordRects.Bottom;
			for (l = j; l <= lastWord; l++) {
				var rectCount = modi.Images.Item(i).Layout.Words(l).Rects.Count;
				for (m = 0; m < rectCount; m++) {
					var thisWordRects = modi.Images.Item(i).Layout.Words(l).Rects.Item(m);
					if (thisWordRects.Left < minLeft) {
						minLeft = thisWordRects.Left;
					}
					if (thisWordRects.Top < minTop) {
						minTop = thisWordRects.Top;
					}
					if (thisWordRects.Right > maxRight) {
						maxRight = thisWordRects.Right;
					}
					if (thisWordRects.Bottom > maxBottom) {
						maxBottom = thisWordRects.Bottom;
					}
				}
			}
			hOCR.WriteLine('title="bbox ' + minLeft + ' ' + minTop + 
			' ' + maxRight + ' ' + maxBottom + '" >');			
			for (l = j; l <= lastWord; l++) {	
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle==3) { //mi FFace_BOLD (3)
					hOCR.Write("<b>");
				}
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle==2) { // miFFace_ITALIC
					hOCR.Write("<i>");
				}			
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle== 4) { // miFFace_BOLD_ITALIC (4)
					hOCR.Write("<b><i>");
				}
				hOCR.Write('<span class="ocrx_word" title="bbox ');
				var wordRectCount = modi.Images.Item(i).Layout.Words(l).Rects.Count;
				var wordLeft = 0;
				var wordTop = 0;
				var wordRight = 0;
				var wordBottom = 0;
				for (m = 0; m < wordRectCount; m++) {
					var thisWordRects = modi.Images.Item(i).Layout.Words(l).Rects.Item(m);
					if (thisWordRects.Left != wordLeft) {
						wordLeft = thisWordRects.Left;
					}
					if (thisWordRects.Top != wordTop) {
						wordTop = thisWordRects.Top;
					}
					if (thisWordRects.Right != wordRight) {
						wordRight = thisWordRects.Right;
					}
					if (thisWordRects.Bottom != wordBottom) {
						wordBottom = thisWordRects.Bottom;
					}
				}
				hOCR.Write(wordLeft + " " + wordTop + " " + wordRight + " " + wordBottom + '" >');
				hOCR.Write(encodehtml(modi.Images.Item(i).Layout.Words(l).Text));
				hOCR.Write("</span> ");
				if (modi.Images.Item(i).Layout.Words(l).Text=='\n') {
					hOCR.Write("<br/>");
				}
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle==3) { //mi FFace_BOLD (3)
					hOCR.Write("</b>");
				}
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle==2) { // miFFace_ITALIC
					hOCR.Write("</i>");
				}			
				if (modi.Images.Item(i).Layout.Words(l).Font.FaceStyle== 4) { // miFFace_BOLD_ITALIC (4)
					hOCR.Write("</i></b>");
				}
			}
			hOCR.WriteLine("</span></p>");	
			prevLineId = myLineId;
			j = wdCounter;
		}
		hOCR.WriteLine("</div>");
	}
	else {
		hOCR.WriteLine('<div class="ocr_page" title="image ' + fileName + '; bbox 0 0 0 0">&nbsp;</div>');
	}
	}
	hOCR.WriteLine("</body>");
	hOCR.WriteLine("</html>");
	//WScript.Echo(modi.Images.Item(0).Layout.Text); 	
}
