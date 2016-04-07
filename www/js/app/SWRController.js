/*
  @Author: Denis Ivancik 
  @email: denis.ivancik@accenture.com
  @Version: 1.0
  @LastModified: 23.10.2015 Maria Ciskova - download all SWRs related to Installation of current Service Order
  @Description: Controller for SWR page
  @WARNING:  limit for downloaded ContentDocumentLink, ContentVersion and SWR are set to 500, only latest versions are downloaded
*/

var SWR_TmpData	= {};
var SWR_Index	= 0;
var SWR_List	= {};
var SWRupsertList= [];

var SWRs = new SWR();

function SWR()
{
	var RecordId 	= "";
	var Parameters  = {};
	var ParentId 	= "";
	//PageDiv 	: "swr-docs"; // not used

	this.ClearSparePart = function(){
		try{
			RecordId = "";
			ParentId = "";
			Parameters = {};
		}
		catch(err){
			LOG.handle(err,"Object SWR, method ClearSparePart throw error: "+err.message);
		}
	};

	this.SwrController = function(parameters){
		try{
			this.ClearSparePart();
			this.Parameters = parameters;
			this.ParentId = parameters.ParentId;
			this.RecordId = parameters.RecordId;
			$('#swr-docs').html('');
			var loading = $( '<p>Loading...</p>' );
			$('#swr-docs').append(loading);
			$('#swr-docs').trigger("create");
			//updated Maria Ciskova 7.9.2015 to display all swr relevant to service order installation first get the installation Id
			//on success get relevant swrs
			findInstallationOfServiceOrder(this.ParentId);
		}
		catch(err){
			LOG.handle(err,"Object SWR, method SwrController throw error: "+err.message);
		}
	};

	//Maria Ciskova 7.9.2015 method that gets installation ID and get relevant swrs for that installation
	function findInstallationOfServiceOrder(serviceOrderID){
		try{
			var SOUP_SQL= "Select {"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} from {"+SOUP_WORK_ORDER+"}";
			var sWHERE = " where {"+SOUP_WORK_ORDER+":Id} = '" + serviceOrderID +"'";
			var sORDERBY = "";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, 1);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var response = cursor.currentPageOrderedEntries[0];
				if((response!==null) && (response.length>0))
				{
					StockInstallationCheck(response[0]);
				}else{
					$('#swr-docs').html('');
					var noRecords = $( '<p>No records...</p>' );
					$('#swr-docs').append(noRecords);
					$('#swr-docs').trigger("create");
				}
			},function(error){LOG.handle(error,"findInstallationOfServiceOrder - sfSmartstore",querySpec);});
		} catch(err){
			LOG.handle(err,"Object SWR, method findInstallationOfServiceOrder throw error: " + err.message,serviceOrderID);
		}
	}

	function StockInstallationCheck(installationId){
		try{
			var SQLite = SQLTable["SQLITE_STOCK_INSTALLATION"];
			var query = SQLite.SQL + SQLite.WHERE + SQLite.ORDERBY;
			var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : SWRs.ParentId};
			query = ReplaceSQLParameters(query,replaceParams);
			logToConsole(query);
			var querySpec = sfSmartstore().buildSmartQuerySpec(query, SQLite.LIMIT);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var page = cursor.currentPageOrderedEntries[0];
				var Inst_Cluster = page[1];
				if(Inst_Cluster === "Stock"){
					drawStockInstallationMessage();
				}
				else{
					getSmartStoreData(installationId);
				}
			},function(error){LOG.handle(error,"StockInstallationCheck - sfSmartstore",querySpec);});
		}catch(err){
			LOG.handle(err,"StockInstallationCheck failed for Installation: "+installationId);
		}
	}

	function drawStockInstallationMessage(){
		try{
			$('#swr-docs').html('');
			var message = $( '<p>Documents are not displayed for STOCK Installations</p>' );
			$('#swr-docs').append(message);
			$('#swr-docs').trigger("create");
		}catch(err){
			LOG.handle(err,"Error when drawing 'STOCK' Installation message");
		}
	}

	//Method for get data from SmartStore updated by Maria Ciskova 8.9.2015
	function getSmartStoreData(installationId){
		try{
			$( '#swr-docs' ).html('');
			var SQL_PARAMS = SQLTable[SWRs.Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE; 
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var SOUP_SQL= SQL_PARAMS.SQL;
			var replacement = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : installationId};
			var WHERE = ReplaceSQLParameters(sWHERE,replacement);
			WHERE += getSearchCriteria();
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(querySpec, 
				function(cursor){
					var page = cursor.currentPageOrderedEntries;
					//Maria Ciskova 22.10.2015
					if(page.length>0){
						getContentDocumentLink(page);
					}
					else{
						var noRecords = $( '<p>No records...</p>' );
						$('#swr-docs').append(noRecords);
						$('#swr-docs').trigger("create");
					}
				},function(error){LOG.handle(error,"SWR - getSmartStoreData - sfSmartstore",querySpec);}
			);
		}
		catch(err){ 
			LOG.handle(err,"Object SWR, method getSmartStoreData throw error: " + err.message);
		}
	}

	//Maria Ciskova 20.10.2015 method gets all ContentDocumentLink record that is linked to downloaded SWRs = has LinkedEntityId in SWR ids
	function getContentDocumentLink(responseSWR){
		try{
			var sqlOR = "";	
			for(var i=0,j=responseSWR.length;i<j;i++){
				receivedRecord = responseSWR[i];
				sqlOR += "OR {"+SOUP_SWR_CONTENT_DOC_LINK+":LinkedEntityId} = '"+receivedRecord[0].Id+"' ";
			}
			sqlOR = sqlOR.slice(3);
			
			var SOUP_SQL= "Select {"+SOUP_SWR_CONTENT_DOC_LINK+":ContentDocumentId} from {"+SOUP_SWR_CONTENT_DOC_LINK+"}";
			var sWHERE = " where "+sqlOR;
			var sORDERBY = "";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, 500);

			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var response = cursor.currentPageOrderedEntries;
				if((response!==null) && (response.length>0)){
					getContentVersion(response);
				}
				else{
					$('#swr-docs').html('');
					var noRecords = $( '<p>No records...</p>' );
					$('#swr-docs').append(noRecords);
					$('#swr-docs').trigger("create");
				}
			},function(error){LOG.handle(error,"getContentDocumentLink - sfSmartstore",querySpec);});
		}catch(err){
			LOG.handle(err,"Object SWR, method getContentDocumentLink throw error: " + err.message);
		}
	}

	//Maria Ciskova 20.10.2015 method gets all ContentVersion record that has ContentDocumentId as downloaded ContentDocumentLink
	function getContentVersion(responseContDocLink) {
		try{
			var sqlOR = "";
			for(var i=0,j=responseContDocLink.length;i<j;i++){
				receivedRecord = responseContDocLink[i];
				sqlOR += "OR {"+SOUP_SWR_CONTENT_VERSION+":ContentDocumentId} = '"+receivedRecord[0]+"' ";
			}
			sqlOR = sqlOR.slice(3);

			//var SOUP_SQL= "Select {"+SOUP_SWR_CONTENT_VERSION+":Id}, {"+SOUP_SWR_CONTENT_VERSION+":Title} from {"+SOUP_SWR_CONTENT_VERSION+"}";
			var SOUP_SQL= "Select {"+SOUP_SWR_CONTENT_VERSION+":Id}, {"+SOUP_SWR_CONTENT_VERSION+":Title}, {"+SOUP_SWR_CONTENT_VERSION+":LastModifiedDate} from {"+SOUP_SWR_CONTENT_VERSION+"}";
			var sWHERE = " where "+sqlOR;
			//var sORDERBY = "";
			var sORDERBY ="ORDER BY Case when {"+SOUP_SWR_CONTENT_VERSION+":Extension} <> 'undefined' THEN {"+SOUP_SWR_CONTENT_VERSION+":_soupLastModifiedDate} END desc, {"+SOUP_SWR_CONTENT_VERSION+":LastModifiedDate} DESC ";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, 500);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var response = cursor.currentPageOrderedEntries;
				if((response!==null) && (response.length>0))
				{
					SWRs.onSuccessSPDataRetrieve(response);
				}
				else{
					$('#swr-docs').html('');
					var noRecords = $( '<p>No records...</p>' );
					$('#swr-docs').append(noRecords);
					$('#swr-docs').trigger("create");
				}
			},function(error){LOG.handle(error,"getContentVersion - sfSmartstore",querySpec);});
		}catch(err){
			LOG.handle(err,"Object SWR, method getContentVersion throw eror: " + err.message);
		}
	}

	//updated Maria Ciskova 23.10.2015
	// Render SWR Documents Tab
	// Must be implemented with recursion, because
	// window.resolveLocalFileSystemURL is asynchronous
	this.onSuccessSPDataRetrieve = function(response){
		try{
			if(response.length > 0) {
				$("#swr-docs").html("");
				SWR_List = $("<div class='document' ></div>");

				SWR_TmpData = response;	// Store SmartStore response to global variable
				SWR_Index = 0;			// Reset index of iteration
				// parse info from first row of response
				var entry = SWR_TmpData[SWR_Index];
				var Id = entry[0];
				var title = checkFieldValue(entry[1],"string");
				title = title.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				//var extension = checkFieldValue(entry[2],"string");
				var filePath = DEFAULT_FILE_PATH+"["+Id+"]"+title;

				// Call asynchronous function that checks if File exists on Device
				// When successful, it calls 'SWRFoundFile();',
				// otherwise it calls 'SWRFoundNoFile();'
				window.resolveLocalFileSystemURL(filePath,SWRFoundFile,SWRFoundNoFile);
				// Drawing other response rows are handled by  ↑   and by   ↑
			}else{
				$('#swr-docs').html('');
				var noRecords = $( '<p>No records...</p>' );
				$('#swr-docs').append(noRecords);
				$('#swr-docs').trigger("create");
			}
		}
		catch(err){
			LOG.handle(err,"onSuccessSPDataRetrieve: " + err.message);
		} 
	};

	//updated Maria Ciskova 23.10.2015
	// Displays a row with Downloaded SWR Document
	//name of the file contains the extension
	function SWRFoundFile(){
		try{
			// get current response row
			var entry = SWR_TmpData[SWR_Index];

			var Id = entry[0]; 
			var name = checkFieldValue(entry[1],"string");
			var date = checkFieldValue(entry[2],"string");
			date = DateTimeObject.FromSFDateTimeToDDMMYYYYFormat(date);
			name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
			var FileName = "["+Id+"]"+name;
			var switch_Id = Id+API_VALUE_SEPARATOR+name;

			var newRow = $(
				"<div class='document-row'>" +
					"<div onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")' class='swipeon document-label' >" +
						"<p class='padl1em'>" + name + "</p>" +
						"<p  class='padl1em small italic'>" + date + "</p>" +
					"</div>" +
					"<div class='center document-slider' >"+
						"<div class='swipeDiv' onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")'>"+
							"<input type='image' alt='Submit' id='"+switch_Id+"' src='images/icons/download slider2-35.png' "+
							" width='64' height='21' />"+
						"</div>"+
					"</div>"+
					"<div class='clear-both'></div>"+
				"</div>");	 

			SWR_List.append(newRow);
			SWR_Index++;	// raise Index, for next iteration, next response row

			if(SWR_Index < SWR_TmpData.length){
				entry = SWR_TmpData[SWR_Index]; 
				Id = entry[0]; 
				name = checkFieldValue(entry[1],"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				FileName = "["+Id+"]"+name;
				var filePath = DEFAULT_FILE_PATH+FileName;
				// check if File Exists and go to next iteration
				window.resolveLocalFileSystemURL(filePath,SWRFoundFile,SWRFoundNoFile);
			}else{
				// this was last response row, last document, let's clean up and finish
				SWR_TmpData = {};
				SWR_Index = 0;
				var searchBlock = generateSearchBlock();
				$("#swr-docs").append(searchBlock);
				$("#swr-docs").append(SWR_List);
				$("#swr-docs").trigger("create");
				EnableSwipe();
				//DisableSwipe();
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"We haven't found SWR file, but error occurred");
		}
	}

	//updated Maria Ciskova 23.10.2015
	// Displays a row with SWR Document that is not Downloaded yet
	//name of the file contains extension
	function SWRFoundNoFile(){
		try{
			// get current response row
			var entry = SWR_TmpData[SWR_Index]; 
			
			var Id = entry[0]; 
			var name = checkFieldValue(entry[1],"string");
			name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
			var date = checkFieldValue(entry[2],"string");
			date = DateTimeObject.FromSFDateTimeToDDMMYYYYFormat(date);
			var FileName = "["+Id+"]"+name;
			var switch_Id = Id+API_VALUE_SEPARATOR+name;

			var newRow = $(
				"<div class='document-row'>" +
					"<div class='swipeon document-label' >" +
						"<p class='padl1em'>" + name + "</p>" +
						"<p  class='padl1em small italic'>" + date + "</p>" +
					"</div>" +
					"<div class='center document-slider' >"+
						"<div class='swipe2download swipeDiv' onclick='FileManager.DownloadSelectedSWR("+JSON.stringify(switch_Id)+")' >"+
							"<input type='image' alt='Submit' id='"+switch_Id+"' src='images/icons/download slider2-38.png' "+
							" width='64' height='21' />"+
						"</div>"+
					"</div>"+
					"<div class='clear-both'></div>"+
				"</div>");
			SWR_List.append(newRow);
			SWR_Index++;	// raise Index, for next iteration, next response row

			if(SWR_Index < SWR_TmpData.length){
				entry = SWR_TmpData[SWR_Index]; 
				Id = entry[0]; 
				name = checkFieldValue(entry[1],"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				FileName = "["+Id+"]"+name;
				var filePath = DEFAULT_FILE_PATH+FileName;
				// check if File Exists and go to next iteration
				window.resolveLocalFileSystemURL(filePath,SWRFoundFile,SWRFoundNoFile);
			}else{
				// this was last response row, last document, let's clean up and finish
				SWR_TmpData = {};
				SWR_Index = 0;
				var searchBlock = generateSearchBlock();
				$("#swr-docs").append(searchBlock);
				$("#swr-docs").append(SWR_List);
				$("#swr-docs").trigger("create");
				EnableSwipe();
				//DisableSwipe();
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"We found SWR file, but error occurred");
		}
	}

	this.checkDownloadedSWRs = function(){
		try{
			var querySpec = sfSmartstore().buildSmartQuerySpec("Select {"+SOUP_SWR_CONTENT_VERSION+":_soup} FROM {"+SOUP_SWR_CONTENT_VERSION+"} ", 2000);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				prepareSWRs4Checking(cursor.currentPageOrderedEntries);
			},function(error){
				LOG.handle(error,"SmartStore Error when querying all SWRs");
			});
		}
		catch(Pokemon){
			LOG.handle(Pokemon,"Could not correctly check if SWRs are downloaded");
		}
	};

	function prepareSWRs4Checking(response){
		try{
			if(response !== undefined && response !== null && response.length > 0){
				SWRupsertList = [];
				SWR_TmpData = response;
				SWR_Index = 0;
				var entry = SWR_TmpData[SWR_Index];
				var Id = entry[0].Id;
				var name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var filePath = DEFAULT_FILE_PATH+"["+Id+"]"+name;
				window.resolveLocalFileSystemURL(filePath, markForUpsert, parseNextSWR);
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not prepare SWRs for checking");
		}
	}

	function markForUpsert(){
		try{
			var entry = SWR_TmpData[SWR_Index];
			entry[0].Extension = entry[0].FileExtension;
			SWRupsertList.push(entry[0]);
			parseNextSWR();
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not mark for Upsert");
		}
	}

	function parseNextSWR(){
		try{
			SWR_Index++;
			if(SWR_Index < SWR_TmpData.length)
			{
				var entry = SWR_TmpData[SWR_Index];
				var Id = entry[0].Id;
				var name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var filePath = DEFAULT_FILE_PATH+"["+Id+"]"+name;
				window.resolveLocalFileSystemURL(filePath, markForUpsert, parseNextSWR);
			}else{
				upsertSWRExtensions();
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not parse next SWR");
		}
	}

	function upsertSWRExtensions(){
		try{
			if(SWRupsertList.length > 0){
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_SWR_CONTENT_VERSION, SWRupsertList, "Id",function(){
					LOG.say("Successfully found and refreshed "+SWRupsertList.length+" SWRs");
				},function(error){
					LOG.handle(error,"Could not modify SWRs in SmartStore",SWRupsertList);
				});
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not upsert SWRs with Extensions",SWRupsertList);
		}
	}
	
	function generateSearchBlock(){
		document.getElementById("search-popup-submit").onclick = function(){
			$("#search-popup").popup("close");
			SWRs.SwrController(SWRs.Parameters);
		};
		
		document.getElementById("search-popup-input-box").onkeyup = function (event) {							
				if (event.keyCode === 13) {			   
				   $("#search-popup").popup("close");
				   SWRs.SwrController(SWRs.Parameters);
				}
		};
		
		return $("<div class='search-icon-block'><img src='images/icons/search-circle-32.png' onclick='openSearch();' class='float-right'/><br/><br/></div>");
	}

	function getSearchCriteria(){
		var result = '';
		try{
			var searchText = document.getElementById("search-popup-input-box").value;
			if(searchText !== undefined && searchText !== null && searchText !== ''){
				searchText = searchText.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				if(searchText !== ''){
					result += " AND upper({"+SOUP_SWR_TABLE+":Service_Work_Report_Name__c}) LIKE '%"+searchText.toUpperCase()+"%'";
				}
				 document.getElementById("search-popup-input-box").value = '';
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not compile search text");
		}
		return result;
	}

}