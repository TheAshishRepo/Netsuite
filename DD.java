import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map.Entry;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.OutputKeys;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPathExpressionException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.xml.sax.SAXException;
// test commit 
class MyFolder {
	HashSet<String> objectfiles = new HashSet<String>();
	HashSet<String> jsfiles = new HashSet<String>();
	String foldername;
}

public class DD {
	static HashMap<String, MyFolder> myfolders = new HashMap<String, MyFolder>();
	static HashSet<String> fileexists = new HashSet<String>();

	public static String getExtension(String filename) {
		if (filename == null) {
			return null;
		}
		int extensionPos = filename.lastIndexOf(".");
		return filename.substring(extensionPos + 1);
	}

	public static ArrayList<String> getSortOrder(HashSet<String> set) throws IOException {
		BufferedReader reader = new BufferedReader(new FileReader("./sortorder.txt"));
		String line = reader.readLine();
		LinkedHashMap<String, HashSet<String>> lhmap = new LinkedHashMap<String, HashSet<String>>();
		while (line != null) {
			lhmap.put(line, new HashSet<String>());
			line = reader.readLine();
		}
		reader.close();
		Iterator<String> itr = set.iterator();
		Iterator<String> keys;
		while (itr.hasNext()) {
			String file = itr.next();
			boolean flag = false;
			keys = lhmap.keySet().iterator();
			while (keys.hasNext()) {
				String key = keys.next();
				if (file.contains(key) && !key.equals("allothersss")) {
					lhmap.get(key).add(file);
					System.out.println(key + " <> " + file);
					flag = true;
					break;
				}
			}
			if (flag == false)// Default category
				lhmap.get("allothersss").add(file);
		}
		ArrayList<String> alllist = new ArrayList<String>();
		keys = lhmap.keySet().iterator();

		while (keys.hasNext())
			alllist.addAll(lhmap.get(keys.next()));

		System.out.println(lhmap);
		System.out.println(alllist);
		return alllist;
	}

	public static void deployGenerator(MyFolder mf)
			throws ParserConfigurationException, TransformerException, IOException {
		DocumentBuilderFactory docFactory = DocumentBuilderFactory.newInstance();
		DocumentBuilder docBuilder = docFactory.newDocumentBuilder();
		Document doc = docBuilder.newDocument();
		Element rootElement = doc.createElement("deploy");
		doc.appendChild(rootElement);
		String pwd = "~";
		// Creating configuration node
		Element configuration = doc.createElement("configuration");
		rootElement.appendChild(configuration);
		Element path = doc.createElement("path");
		path.appendChild(doc.createTextNode(pwd + "/AccountConfiguration/*"));
		configuration.appendChild(path);
		// Creating files node
		Iterator<String> itr = null;
		if (mf.jsfiles != null && mf.jsfiles.size() > 0) {
			Element files = doc.createElement("files");
			rootElement.appendChild(files);
			itr = mf.jsfiles.iterator();
			while (itr.hasNext()) {
				path = doc.createElement("path");
				String name = itr.next();
				name = name.substring(name.indexOf("/") + 1);
				String filer = pwd + "/FileCabinet/" + name;
				if (!fileexists.contains(filer)){
					path.appendChild(doc.createTextNode(filer));
					files.appendChild(path);
					fileexists.add(filer);
				}
			}
		}
		// Creating Objects node,This field is mandatory
		Element objects = doc.createElement("objects");
		rootElement.appendChild(objects);
		itr = mf.objectfiles.iterator();
		// TODO:Insert the sort order on mf.objectfiles
		System.out.println("---:GENERATING ORDERED FILE:---");
		if (itr.hasNext()) {
			itr = getSortOrder(mf.objectfiles).iterator();
		}
		while (itr.hasNext()) {
			path = doc.createElement("path");
			path.appendChild(doc.createTextNode(pwd + "/" + itr.next()));
			objects.appendChild(path);
		}
		path = doc.createElement("path");
		// path.appendChild(doc.createTextNode(pwd +
		// "/Objects/custbody_sdf_dummy_field.xml"));
		// objects.appendChild(path);

		pwd = System.getProperty("user.dir") + "/" + mf.foldername;
		File dir = new File(pwd + "/Objects/dummy");
		dir.mkdir();
		path.appendChild(doc.createTextNode("~/Objects/dummy/*"));
		objects.appendChild(path);
		
		System.out.println("PWD:" + pwd);
		String filepath = pwd + "/deploy.xml";
		TransformerFactory transformerFactory = TransformerFactory.newInstance();
		Transformer transformer = transformerFactory.newTransformer();
		transformer.setOutputProperty(OutputKeys.INDENT, "yes");
		DOMSource source = new DOMSource(doc);
		FileWriter writer = new FileWriter(new File(filepath));
		StreamResult result = new StreamResult(writer);
		transformer.transform(source, result);
		System.out.println("Deploy File:" + filepath);
		Path paths = Paths.get(filepath);
		String content = null;
		byte[] encoded = Files.readAllBytes(paths);
		content = new String(encoded);
		System.out.println("--------File Content----------");
		System.out.println(content);
		System.out.println("--------------------");
		
	}

	// TODO: Filter Files : manifest.xml,deploy.xml,*.attr.xml,
	public static void main(String[] args) throws ParserConfigurationException, TransformerException, IOException,
			SAXException, XPathExpressionException {
		BufferedReader reader = new BufferedReader(new FileReader("./changes.txt"));
		String line = reader.readLine();
		while (line != null) {
		    //Making changes for the new file format
			String filename = line.trim();
			int index = filename.indexOf("/");
			if (index < 0) {
				System.out.println("File not comaptible:" + filename);
				line = reader.readLine();
				continue;
			}
			String foldername = filename.substring(0, index), output = "";
			MyFolder mf = null;
			if(foldername.contains("build")){
				line = reader.readLine();
				continue;
			}
			if (myfolders.get(foldername) == null) {
				mf = new MyFolder();
				mf.foldername = foldername;
				myfolders.put(foldername, mf);
			}
			mf = myfolders.get(foldername);
			// Strips of FileCabinet
			filename = filename.substring(index + 1);
			String fileextension = getExtension(filename);
			if (fileextension.equals("xml") && !filename.contains("attr.xml") && !filename.contains("deploy.xml")
					&& !filename.contains("manifest.xml") && !filename.contains(".sh") && !filename.contains(".txt")
					&& !filename.contains(".properties") && !filename.contains(".jar")  && !filename.contains("build")) {
				output = "Object File found : " + filename ;
				// Scripts is done below for dependency checking[Can be extended for other objects]
				if (filename.contains("customscript")) {

					HashSet<String> set = ObjectFileDOMParser.getDependentFiles(foldername, filename);
					if (set != null && set.size() > 0) {
						mf.jsfiles.addAll(set);
						output += " --> dependent Files: " + set.toString();
					} else {
						output += " --> ERROR\n";
						System.out.println(output);
						line = reader.readLine();
						continue;
					}
				}
				mf.objectfiles.add(filename);
			}
			if (fileextension.equals("js") || fileextension.equals("html")) {
				output += "JS File found: " + filename;
				mf.jsfiles.add(filename);
			}
			System.out.println(output);
			line = reader.readLine();
		}
		reader.close();
		Iterator<Entry<String, MyFolder>> value = myfolders.entrySet().iterator();
		System.out.println(myfolders);
		String folders = "";
		while (value.hasNext()) {
			String key = value.next().getKey();
			folders += "\n" + key;
			deployGenerator(myfolders.get(key));
		}

		FileWriter fw = new FileWriter("folders.txt");
		// Write all the folders to folders.txt if there were valid changes found
		if (folders.length() > 0)
			fw.write(folders.substring(1) + "\n");
		else// If there were no files to be committed the folders file will be empty
			fw.write("");
		fw.close();
	}
}
