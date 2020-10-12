import java.io.File;
import java.io.IOException;
import java.util.HashSet;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;


public class ObjectFileDOMParser {
    public static boolean fileExists(String filename){
        File tempFile = new File(filename);
        System.out.println(filename+" found: " + tempFile.exists());
        return  tempFile.exists(); 
    }
    public static HashSet<String> getDependentFiles(String folder,String xmlFile) throws ParserConfigurationException, SAXException, IOException, XPathExpressionException {
        System.out.println(folder + " --- " +xmlFile);
        HashSet<String> set = new HashSet<String>();
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(folder+"/"+xmlFile); 
        //Get XPath 
        XPathFactory xpf = XPathFactory.newInstance();
        XPath xpath = xpf.newXPath();
        String mainfilename =  ((String)xpath.evaluate("/"+doc.getDocumentElement().getNodeName()+"/scriptfile/text()", doc, XPathConstants.STRING));
        if(mainfilename==null)
            return null;
        if(mainfilename.equals("[]"))
            return null;
        if(mainfilename.equals(""))
            return null;
        
        mainfilename = mainfilename.substring(1, mainfilename.length()-1);
        if(fileExists(folder+"/FileCabinet/"+mainfilename))
            set.add(mainfilename);
        else{
            return null;//The file does not exist so we terminate the flow
        }
        XPathExpression expr = xpath.compile("//library/scriptfile/text()");
        NodeList nodes =(NodeList) expr.evaluate(doc, XPathConstants.NODESET);
        for (int i = 0; i < nodes.getLength(); i++) {
            String filename = nodes.item(i).getNodeValue();
            filename = filename.substring(1, filename.length()-1);
            if(fileExists(folder+"/FileCabinet/"+filename)){
                set.add(filename);
            }else{
                return null;//The file does not exist so we terminate the flow
            }
        }
        return set;
    }
}
    