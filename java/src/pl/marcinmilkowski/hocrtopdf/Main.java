package pl.marcinmilkowski.hocrtopdf;

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
 * Copyright 2007
 * @author Florian Hackenberger <florian@hackenberger.at>
 * Modified by Marcin Mi³kowski <http://marcinmilkowski.pl>
 */

import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import net.htmlparser.jericho.Source;
import net.htmlparser.jericho.StartTag;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.Font;
import com.itextpdf.text.Image;
import com.itextpdf.text.Rectangle;
import com.itextpdf.text.pdf.PdfContentByte;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.text.pdf.codec.TiffImage;
import com.itextpdf.text.pdf.RandomAccessFileOrArray;
import com.itextpdf.text.pdf.BaseFont;

/**
 * A quickhack for converting from hOCR to PDF
 * 
 * @author fhackenberger
 */
public class Main {

  public static final Pattern OCRLINE = Pattern.compile("ocr_line");
  public static final Pattern OCRPAGE = Pattern.compile("ocr_page");
  public static final Pattern OCRPAGEORLINE = Pattern
      .compile("ocrx_word|ocr_page");
  public static final Pattern OCRXWORD = Pattern.compile("ocrx_word");

  /**
   * @param args
   */
  public static void main(String[] args) {
    try {
      if (args.length < 1 || args[0] == "--help" || args[0] == "-h") {
        System.out
            .print("Usage: java pl.marcinmilkowski.hocrtopdf.Main INPUTURL.html OUTPUTURL.pdf\n"
                + "\n"
                + "Converts hOCR files into PDF\n"
                + "\n"
                + "Example: java pl.marcinmilkowski.hocrtopdf.Main hocr.html output.pdf\n");
        if (args.length < 1)
          System.exit(-1);
        else
          System.exit(0);
      }
      URL inputHOCRFile = null;
      FileOutputStream outputPDFStream = null;
      try {
        File file = new File(args[0]);
        inputHOCRFile = file.toURI().toURL();
      } catch (MalformedURLException e) {
        System.out.println("The first parameter has to be a valid file.");
        System.out.println("We got an error: " + e.getMessage());
        System.exit(-1);
      }
      try {
        outputPDFStream = new FileOutputStream(args[1]);
      } catch (FileNotFoundException e) {
        System.out.println("The second parameter has to be a valid URL");
        System.exit(-1);
      }

      // The resolution of a PDF file (using iText) is 72pt per inch
      float pointsPerInch = 72.0f;

      // Using the jericho library to parse the HTML file
      Source source = new Source(inputHOCRFile);

      int pageCounter = 1;

      Document pdfDocument = null;
      PdfWriter pdfWriter = null;
      PdfContentByte cb = null;
      RandomAccessFileOrArray ra = null;

      // Find the tag of class ocr_page in order to load the scanned image
      StartTag pageTag = source.getNextStartTag(0, "class", OCRPAGE);
      while (pageTag != null) {
        int prevPos = pageTag.getEnd();
        Pattern imagePattern = Pattern.compile("image\\s+([^;]+)");
        Matcher imageMatcher = imagePattern.matcher(pageTag.getElement()
            .getAttributeValue("title"));
        if (!imageMatcher.find()) {
          System.out
              .println("Could not find a tag of class \"ocr_page\", aborting.");
          System.exit(-1);
        }
        // Load the image
        Image pageImage = null;        
        try {
          File file = new File(imageMatcher.group(1));
          pageImage = Image.getInstance(file.toURI().toURL());
        } catch (MalformedURLException e) {
          System.out.println("Could not load the scanned image from: "
              + "file://" + imageMatcher.group(1) + ", aborting.");
          System.exit(-1);
        }
        if (pageImage.getOriginalType() == Image.ORIGINAL_TIFF) { // this might
                                                                  // be
                                                                  // multipage
                                                                  // tiff!
          File file = new File(imageMatcher.group(1));
          if (pageCounter == 1 || ra == null) {
            ra = new RandomAccessFileOrArray(file.toURI().toURL());
          }
          int nPages = TiffImage.getNumberOfPages(ra);
          if (nPages > 0 && pageCounter <= nPages) {
            pageImage = TiffImage.getTiffImage(ra, pageCounter);
          }
        }
        int dpiX = pageImage.getDpiX();
        if (dpiX == 0) { // for images that don't set the resolution we assume
                         // 300 dpi
          dpiX = 300;
        }
        int dpiY = pageImage.getDpiY();
        if (dpiY == 0) { // as above for dpiX
          dpiY = 300;
        }
        float dotsPerPointX = dpiX / pointsPerInch;
        float dotsPerPointY = dpiY / pointsPerInch;
        float pageImagePixelHeight = pageImage.getHeight();
        if (pdfDocument == null) {
          pdfDocument = new Document(new Rectangle(pageImage.getWidth()
              / dotsPerPointX, pageImage.getHeight() / dotsPerPointY));
          pdfWriter = PdfWriter.getInstance(pdfDocument, outputPDFStream);
          pdfDocument.open();
          // Put the text behind the picture (reverse for debugging)
          // cb = pdfWriter.getDirectContentUnder();
          cb = pdfWriter.getDirectContent();
        } else {
          pdfDocument.setPageSize(new Rectangle(pageImage.getWidth()
              / dotsPerPointX, pageImage.getHeight() / dotsPerPointY));
          pdfDocument.newPage();          
        }
        // first define a standard font for our text
        BaseFont base = BaseFont.createFont(BaseFont.HELVETICA,
            BaseFont.CP1250, BaseFont.EMBEDDED);
        Font defaultFont = new Font(base, 8);
        // FontFactory.getFont(FontFactory.HELVETICA, 8, Font.BOLD,
        // CMYKColor.BLACK);

        cb.setHorizontalScaling(1.0f);

        pageImage.scaleToFit(pageImage.getWidth() / dotsPerPointX, pageImage
            .getHeight()
            / dotsPerPointY);
        pageImage.setAbsolutePosition(0, 0);
        // Put the image in front of the text (reverse for debugging)
        // pdfWriter.getDirectContent().addImage(pageImage);
        pdfWriter.getDirectContentUnder().addImage(pageImage);

        // In order to place text behind the recognised text snippets we are
        // interested in the bbox property
        Pattern bboxPattern = Pattern.compile("bbox(\\s+\\d+){4}");
        // This pattern separates the coordinates of the bbox property
        Pattern bboxCoordinatePattern = Pattern
            .compile("(\\d+)\\s+(\\d+)\\s+(\\d+)\\s+(\\d+)");
        // Only tags of the ocr_line class are interesting
        StartTag ocrTag = source.getNextStartTag(prevPos, "class",
            OCRPAGEORLINE);
        while (ocrTag != null) {
          prevPos = ocrTag.getEnd();
          if ("ocrx_word".equalsIgnoreCase(ocrTag.getAttributeValue("class"))) {
            net.htmlparser.jericho.Element lineElement = ocrTag.getElement();
            Matcher bboxMatcher = bboxPattern.matcher(lineElement
                .getAttributeValue("title"));
            if (bboxMatcher.find()) {
              // We found a tag of the ocr_line class containing a bbox property
              Matcher bboxCoordinateMatcher = bboxCoordinatePattern
                  .matcher(bboxMatcher.group());
              bboxCoordinateMatcher.find();
              int[] coordinates = {
                  Integer.parseInt((bboxCoordinateMatcher.group(1))),
                  Integer.parseInt((bboxCoordinateMatcher.group(2))),
                  Integer.parseInt((bboxCoordinateMatcher.group(3))),
                  Integer.parseInt((bboxCoordinateMatcher.group(4))) };
              String line = lineElement.getContent().getTextExtractor()
                  .toString();
              float bboxWidthPt = (coordinates[2] - coordinates[0])
                  / dotsPerPointX;
              float bboxHeightPt = (coordinates[3] - coordinates[1])
                  / dotsPerPointY;

              // Put the text into the PDF
              cb.beginText();
              // Comment the next line to debug the PDF output (visible Text)
              cb
                  .setTextRenderingMode(PdfContentByte.TEXT_RENDER_MODE_INVISIBLE);
              // height
              cb.setFontAndSize(defaultFont.getBaseFont(), Math.max(Math
                  .round(bboxHeightPt), 1));
              // width
              cb.setHorizontalScaling(bboxWidthPt
                  / cb.getEffectiveStringWidth(line, false));
              cb.moveText((coordinates[0] / dotsPerPointX),
                  ((pageImagePixelHeight - coordinates[3]) / dotsPerPointY));
              cb.showText(line);
              cb.endText();
              cb.setHorizontalScaling(1.0f);
            }
          } else {
            if ("ocr_page".equalsIgnoreCase(ocrTag.getAttributeValue("class"))) {
              pageCounter++;
              pageTag = ocrTag;
              break;
            }
          }
          ocrTag = source.getNextStartTag(prevPos, "class", OCRPAGEORLINE);
        }
        if (ocrTag == null) {
          pdfDocument.close();
          break;
        }
      }
    } catch (DocumentException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    } catch (IOException e) {
      // TODO Auto-generated catch block
      e.printStackTrace();
    }
  }

}