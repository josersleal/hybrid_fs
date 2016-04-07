/*
  @Author: Mathias Nyman 
  @email: m.nyman@accenture.com, 
  @Version: 1.0 
  @Description: Controller for TKIC pages
*/
var TKIC_TmpData= {};// Denis Ivancik 31.8. 
var TKIC_Index	= 0; // these global variables are required
var TKIC_List	= {};// for 'window.resolveLocalFileSystemURL' function
var TKIC_dupes	= {};// because it cannot access Object Variables
var ASI_OrderList = ['Service Letter', 'Technical Bulletin', 'Instructions', 'Spare Parts Notice', 'Data & Specifications','General Information'];
var MAN_OrderList = ['Operation', 'Maintenance', 'Operation & Maintenance', 'Attachments', 'Work card'];
var TKIC_UpsertList= [];
//maps that are holding all possible subtypes
var ASI_SubTypesMap = {"All Documents":"All Documents"};
var MAN_SubTypesMap = {"All Documents":"All Documents"};
var SPC_SubTypesMap = {"All Documents":"All Documents"};

//map holding all equipment Ids and names of the related installationId
var TKIC_EquipmentMap = {};
var TKIC_DownloadedEquipmentList = [];
var LOCAL_STORAGE_EQUIPMENT = "downloadedEquip";
var TKICController = new TKICController();

function TKICController()
{
	var RecordId 	= "";
	var Parameters  = {};
	var ParentId 	= "";
	var Order	 	= "";
	var isRendering = false;
	this.PageDiv = "bulletins-docs";
	this.PageTab = "bulletins.html";
	this.SelectedSubtypeValues = {"All Documents":"All Documents"};
	this.SelectedEquipment = "";
	
	this.GetParameters = function() {
		return Parameters;
	};

	this.Constructor = function(parameters) {
		try {
			if(isRendering){
				return;
			}else{
				isRendering = true;
			}
			TKICController.ClearTKIC();
			Parameters = parameters;
			ParentId = parameters.ParentId;
			RecordId = parameters.RecordId;
			FileType = parameters.FileType;
			var retreivedEquip = localStorage.getItem(LOCAL_STORAGE_EQUIPMENT);
			if((retreivedEquip !== null) && (retreivedEquip !== "")){
				TKIC_DownloadedEquipmentList = JSON.parse(retreivedEquip);
			}
			switch(parameters.FileType){
				case "ASI":
					TKICController.PageDiv = "bulletins-docs";
					TKICController.PageTab = "Bulletins.html";
					Order = getOrderBy(ASI_OrderList);
					break;
				case "MAN":
					TKICController.PageDiv = "manuals-docs";
					TKICController.PageTab = "Manuals.html";
					Order = getOrderBy(MAN_OrderList);
					break;
				case "SPC":
					TKICController.PageDiv = "spc-docs";
					TKICController.PageTab = "Spc.html";
					Order = getOrderBy([]);
					break;
				default:
					alert("TKICController Constructor Error: Could not parse " + parameters.FileType + " as FileType.");
					isRendering = false;
					return;
			}
			StockInstallationCheck(ParentId);
		}
		catch(err) {
			LOG.handle(err,"TKICController Constructor Error: " + err.message,parameters);
			isRendering = false;
		}
	};

	this.ClearTKIC = function(){
		try
		{
			RecordId = "";
			ParentId = "";
			Parameters = {};
			FileType = "";
			TKIC_dupes = {};
			Order = "";
			TKIC_DownloadedEquipmentList = [];							
			TKIC_EquipmentMap={};			
		}
		catch(err)
		{
			LOG.handle(queryError,"TKICController, method ClearTKIC throw error: "+err.message);			
		}	
	};

	function StockInstallationCheck(ServiceOrderId){
		try{
			var SQLite = SQLTable["SQLITE_STOCK_INSTALLATION"];
			var query = SQLite.SQL + SQLite.WHERE + SQLite.ORDERBY;
			var replaceParams = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : ServiceOrderId};
			query = ReplaceSQLParameters(query,replaceParams);
			var querySpec = sfSmartstore().buildSmartQuerySpec(query, SQLite.LIMIT);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var page = cursor.currentPageOrderedEntries;
				var Inst_Cluster = page[0][1];
				if(Inst_Cluster === "Stock"){
					drawStockInstallationMessage();
					isRendering = false;
				}
				else{
					$('#' + TKICController.PageDiv ).html('');
					var loading = $( '<p>Loading...</p>' );
					$('#' + TKICController.PageDiv ).append(loading);
					$('#' + TKICController.PageDiv).trigger("create");
					TKICController.findEquipmentId();
				}
			},function(queryError){
				LOG.handle(queryError,"TKICController, StockInstallationCheck, runSmartQuery raised error: "+queryError.message,querySpec);
				isRendering = false;
			});
		}
		catch(err){
			LOG.handle(err,"Error when checking 'STOCK' Installation");
			isRendering = false;
		}
	}

	function drawStockInstallationMessage(){
		try{
			$('#' + TKICController.PageDiv ).html('');
			var message = $( '<p>Documents are not displayed for STOCK Installations</p>' );
			$('#' + TKICController.PageDiv ).append(message);
			$('#' + TKICController.PageDiv).trigger("create");
		}catch(err){
			LOG.handle(err,"Error when drawing 'STOCK' Installation message");
		}
	}

	this.findEquipmentId = function(){
		try{
			var SQL = " Select {"+SOUP_WORK_ORDER+":WRTS_Equipment_ID__c},{"+SOUP_WORK_ORDER+":WRTS_Installation_ID__c} from {"+SOUP_WORK_ORDER+"} ";
			var WHERE = " Where COALESCE({"+SOUP_WORK_ORDER+":Id},'') ='" + ParentId + "' ";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SQL+WHERE, 1);

			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var response = cursor.currentPageOrderedEntries;
				if((response!==null) && (response.length>0))
				{			
					var equipmentId = response[0][0]; // here is Equipment ID
					var installationId = response[0][1]; // here is Installation ID
					if(TKIC_DownloadedEquipmentList.indexOf(equipmentId)==-1){
						TKIC_DownloadedEquipmentList.push(equipmentId);
					}
					TKICController.getAllEquipments(equipmentId, installationId);
				}
			},function(queryError){
				LOG.handle(queryError,"TKICController, findEquipmentId, runSmartQuery raised error: "+queryError.message,querySpec);
				isRendering = false;
			});
		}
		catch(err){
			LOG.handle(err,"TKICController, method findEquipmentId throw error: "+err.message);
			isRendering = false;
		}
	};

	this.getAllEquipments = function(equipmentId, installationId){
		try{
			//alert('findEquipmentId getAllEquipments '+TKICController.SelectedEquipment);
			//alert('SelectedEquipment in getAllEquipments '+TKICController.SelectedEquipment);		
			var SQL = " Select {"+SOUP_EQUIPMENT_TABLE+":Id},{"+SOUP_EQUIPMENT_TABLE+":Equipment_Text__c} from {"+SOUP_EQUIPMENT_TABLE+"} ";
			var WHERE = " Where COALESCE({"+SOUP_EQUIPMENT_TABLE+":Installation__c},'') ='" + installationId + "' ";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SQL+WHERE, 500);

			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var response = cursor.currentPageOrderedEntries;
				//alert('getAllEquipments response '+JSON.stringify(response));
				if((response!==null) && (response.length>0))
				{					
					for(var i=0,j=response.length;i<j;i++){
						var eqId = response[i][0];	
						var eqDescription = response[i][1];
						TKIC_EquipmentMap[eqId]=eqDescription;
					}				
				}
				if(TKICController.SelectedEquipment === ""){
					TKICController.SelectedEquipment = equipmentId;
					TKICController.getSubtypes(equipmentId);
				}
				else	
					TKICController.getSubtypes(TKICController.SelectedEquipment);
			},function(queryError){
				LOG.handle(queryError,"TKICController, findEquipmentId, runSmartQuery raised error: "+queryError.message,querySpec);
				isRendering = false;
			});
		}
		catch(err){
			LOG.handle(err,"TKICController, method findEquipmentId throw error: "+err.message);
			isRendering = false;
		}
	};

	this.getSubtypes = function(equipmentId){
		//alert('SelectedEquipment in getSubtypes '+TKICController.SelectedEquipment);
		try{		
			ASI_SubTypesMap = {"All Documents":"All Documents"};
			MAN_SubTypesMap = {"All Documents":"All Documents"};
			SPC_SubTypesMap = {"All Documents":"All Documents"};
			var SOUP_SQL= "Select {"+SOUP_TI_ARTICLE_KAV+":SubType__c}, {"+SOUP_TI_ARTICLE_KAV+":Main_Type__c}, "+
						  " COALESCE(ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Equipment__c},'') as eq "+
						  " FROM {"+SOUP_TI_ARTICLE_KAV+"} as kav"+
						  " LEFT JOIN {"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+"} as ti ON ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Article_Version_Id__c} = kav.{"+SOUP_TI_ARTICLE_KAV+":Article_Version_Id__c} ";
			var sWHERE = " WHERE ti.{"+SOUP_TI_ARTICLE_ASSIGNMENT_TABLE+":Equipment__c} = '"+equipmentId+"' AND kav.{"+SOUP_TI_ARTICLE_KAV+":Main_Type__c} = '"+Parameters.FileType+"'";
			var sORDERBY = " GROUP BY {"+SOUP_TI_ARTICLE_KAV+":SubType__c}";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, 500);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var response = cursor.currentPageOrderedEntries;
				if((response!==null) && (response.length>0))
				{
					for(var i=0,j=response.length;i<j;i++){
						var subType = response[i][0];
						var mainType = response[i][1];
						if((subType === null)||(subType == 'null'))
							subType = 'Other';
							switch(mainType){
								case "ASI":
									ASI_SubTypesMap[subType]=subType;
									break;
								case "MAN":
									MAN_SubTypesMap[subType]=subType;
									break;
								case "SPC":
									SPC_SubTypesMap[subType]=subType;
									break;
								default:
									isRendering = false;
									return;
							}
					}
				}
				TKICController.getSmartStoreData(equipmentId);
			},function(queryError){
				LOG.handle(queryError,"TKICController, getSubtypes, runSmartQuery raised error: "+queryError.message,querySpec);
				isRendering = false;
			});
		} catch(err)
		{
			LOG.handle(err,"TKICController, getSubtypes throw error:  "+err.message);
			isRendering = false;
		}
	};

	//Method for getting data from SmartStore
	this.getSmartStoreData = function(equipmentId) {
		try {
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var sWHERE = SQL_PARAMS.WHERE; 
			//var sORDERBY = SQL_PARAMS.ORDERBY;
			var sORDERBY = Order;
			var iLimit = SQL_PARAMS.LIMIT;
			var SOUP_SQL= SQL_PARAMS.SQL;

			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":FileType", VariableValue : FileType};
			var WHERE = ReplaceSQLParameters(sWHERE,Params);
			Params = {Ids:[], VariableType : "String", ReplaceValue : ":EquipmentParam", VariableValue : equipmentId};
			WHERE = ReplaceSQLParameters(WHERE,Params);

			//add filtering for subtypes						
			WHERE += addFilterSubtypes(TKICController.SelectedSubtypeValues);
			WHERE += getSearchCriteria();
			var finalQuery = SOUP_SQL + WHERE + sORDERBY;

			logToConsole()("SQLite for  [ " + finalQuery +" ]");
			var querySpec = sfSmartstore().buildSmartQuerySpec(finalQuery, iLimit);

			sfSmartstore().runSmartQuery(querySpec, function(cursor){ 
				var page = cursor.currentPageOrderedEntries;
				TKICController.onSuccessSPDataRetrieve(page);
			},function(queryError){
				LOG.handle(queryError,"TKICController, getSmartStoreData, runSmartQuery raised error: "+queryError.message,querySpec);
				isRendering = false;
			});
		}
		catch(err) {
			LOG.handle(err,"TKICController method getSmartStoreData threw an error: " + err.message,equipmentId);
			isRendering = false;
		}
	};

	this.onSuccessSPDataRetrieve = function(response){
		try {
			if(response.length > 0){
				$("#" + TKICController.PageDiv).html("");
				TKIC_List = $("<div class='document' ></div>");
				TKIC_TmpData = response;	// store SmartStore response to global variable
				TKIC_Index = 0;				// Reset index of iteration

				// parse info from first row of response
				var entry = TKIC_TmpData[TKIC_Index];
				var AVId = entry[0].Article_Version_Id__c;
				var name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var ext = checkFieldValue(entry[0].Extension,"string");
				var filePath = DEFAULT_FILE_PATH+"["+AVId+"]"+name+ext;
				// Call asynchronous function that checks if File exists on Device
				// When successful, it calls 'TKICFoundFile();',
				// otherwise it calls 'TKICFoundNoFile();'
					window.resolveLocalFileSystemURL(filePath, TKICController.TKICFoundFile, TKICController.TKICFoundNoFile);
				// Drawing other response rows are handled by  ↑   and by   ↑
			}
			else{
				$( '#' + TKICController.PageDiv ).html('');
				//if(TKICController.SelectedSubtypeValues['All Documents']!='All Documents'){
					var filter = generateFilterComponent(TKICController.SelectedSubtypeValues);					
					$( '#' + TKICController.PageDiv ).append(filter);
				//}		
				var filterEquipment = generateFilterEquipmentComponent(TKICController.SelectedEquipment);					
				var searchBlock = generateSearchBlock();
				isRendering = false;
				
				$('#' + TKICController.PageDiv).append(filter);
				$('#' + TKICController.PageDiv).append(filterEquipment);					
				$('#' + TKICController.PageDiv).append(searchBlock);				
				var noRecords = $( '<p>No records...</p>' );
				$('#' + TKICController.PageDiv).append(noRecords);
				$("#" + TKICController.PageDiv).trigger("create");
			}
		}
		catch(err){
			LOG.handle(err,"onSuccessSPDataRetrieve Error: [ " + err.message + " ]",response);
			isRendering = false;
		}
	};

	//OBS! This is a recursive function!
	//Due note, that recursion should always be used as a last resort!
	//In addition for being difficult to read, recursion consumes an undefined amount of memory, and can lead to a stack-overflow.
	//This should maybe be written as a loop instead.
	//function TKICFoundFile(){
	this.TKICFoundFile = function(){
		
		try{
			// get current response row
			var entry = TKIC_TmpData[TKIC_Index];
			
			var AVId = entry[0].Article_Version_Id__c;
			var name = checkFieldValue(entry[0].Title,"string");			
			name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');			
			var subtype = checkFieldValue(entry[0].SubType__c,"string");
			var date = checkFieldValue(entry[0].Date__c,"string");
			date = DateTimeObject.toEuropeanFormat(date);
			if (subtype !== ""){
				date =  ", " + date;			
			}
			var ext = checkFieldValue(entry[0].Extension,"string");
			
			var FileName = "["+AVId+"]"+name+ext;
			if(TKIC_dupes[AVId]=== undefined){
				TKIC_dupes[AVId]=true;
				var switch_Id = AVId+API_VALUE_SEPARATOR+name;
				var newRow = $(
					"<div class='document-row'>" +
						"<div onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")' class='swipeon document-label' >" +
							"<p class='padl1em'>" + name + "</p>" +
							"<p class='padl1em small italic'>" + subtype + date + "</p>" +
						"</div>" +
						"<div class='center document-slider' >"+
							"<div class='swipeDiv' onclick='FileManager.OpenLocalFile(" + JSON.stringify(FileName) + ")'>"+
								"<input type='image' alt='Submit' id='"+switch_Id+"' src='images/icons/download slider2-35.png' "+
								" width='64' height='21' />"+
							"</div>"+
						"</div>"+
					"</div>");
				TKIC_List.append(newRow);
			}
			//else{ we skip displaying duplicate file }
			TKIC_Index++;	// raise Index, for next iteration, next response row

			if(TKIC_Index < TKIC_TmpData.length){
				entry = TKIC_TmpData[TKIC_Index]; 
				AVId = entry[0].Article_Version_Id__c; 
				name = checkFieldValue(entry[0].Title,"string"); 
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				ext = checkFieldValue(entry[0].Extension,"string");
				FileName = "["+AVId+"]"+name+ext;
				var filePath = DEFAULT_FILE_PATH+FileName;
				// check if File Exists and go to next iteration
				window.resolveLocalFileSystemURL(filePath,TKICController.TKICFoundFile,TKICController.TKICFoundNoFile);
			}else{
				// this was last response row, last document, let's clean up and finish
				TKIC_TmpData = {};
				TKIC_Index = 0;
				//MC add filter multipicklist	
				var filter = generateFilterComponent(TKICController.SelectedSubtypeValues);
				var filterEquipment = generateFilterEquipmentComponent(TKICController.SelectedEquipment);
				var searchBlock = generateSearchBlock();
				
				$('#' + TKICController.PageDiv).append(filter);
				$('#' + TKICController.PageDiv).append(filterEquipment);
				$('#' + TKICController.PageDiv).append(searchBlock);
				$("#" + TKICController.PageDiv).append(TKIC_List);
				$("#" + TKICController.PageDiv).trigger("create");
				isRendering = false;
				EnableSwipe();
				//DisableSwipe();
			}
		}
		catch(err){
			LOG.handle(err,"TKICFoundFile Error: [ " + err.message + " ]",TKIC_TmpData);
		}
	};

	//OBS! This is a recursive function!
	//Due note, that recursion should always be used as a last resort! 
	//In addition for being difficult to read, recursion consumes an undefined amount of memory, and can lead to a stack-overflow.
	//This should maybe be written as a loop instead.
	//function TKICFoundNoFile(){
	this.TKICFoundNoFile = function(){
		
		try{
			// get current response row
			var entry = TKIC_TmpData[TKIC_Index],AVId,name,FileName;
			if(entry!== undefined && entry !== null){
				AVId = entry[0].Article_Version_Id__c;
				name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var subtype = checkFieldValue(entry[0].SubType__c,"string");
				var date = checkFieldValue(entry[0].Date__c,"string");
				date = DateTimeObject.toEuropeanFormat(date);
				if (subtype !== ""){
					date =  ", " + date;
				}
				FileName = "["+AVId+"]"+name;
				if(TKIC_dupes[AVId]=== undefined){
					TKIC_dupes[AVId]=true;
					var switch_Id = AVId+API_VALUE_SEPARATOR+name;
					var newRow = $(
						"<div class='document-row'>" +
							"<div class='swipeon document-label' >" +
								"<p class='padl1em'>" + name + "</p>" +
								"<p class='padl1em small italic'>" + subtype + date + "</p>" +
							"</div>" +
							"<div class='center document-slider'>"+
								"<div class='swipe2download swipeDiv' onclick='FileManager.DownloadSelectedTKIC("+JSON.stringify(switch_Id)+")' >"+
									"<input type='image' alt='Submit' id='"+switch_Id+"' src='images/icons/download slider2-38.png'"+
									" width='64' height='21' />"+
									//" width='80' height='40' />"+
								"</div>"+
							"</div>"+
						"</div>");
					TKIC_List.append(newRow);
				}
			}
			
			//else{ we skip displaying duplicate row }
			TKIC_Index++;	// raise Index, for next iteration, next response row

			if(TKIC_Index < TKIC_TmpData.length)
			{
				entry = TKIC_TmpData[TKIC_Index];
				AVId = entry[0].Article_Version_Id__c;
				name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var ext = checkFieldValue(entry[0].Extension,"string");
				FileName = "["+AVId+"]"+name+ext;
				var filePath = DEFAULT_FILE_PATH+FileName;
				// check if File Exists and go to next iteration
				window.resolveLocalFileSystemURL(filePath,TKICController.TKICFoundFile,TKICController.TKICFoundNoFile);
			}
			else
			{
				// this was last response row, last document, let's clean up and finish
				TKIC_TmpData = {};
				TKIC_Index = 0;
				
				//MC add filter multipicklist				
				var filter = generateFilterComponent(TKICController.SelectedSubtypeValues);
				var filterEquipment = generateFilterEquipmentComponent(TKICController.SelectedEquipment);					
				var searchBlock = generateSearchBlock();

				$('#' + TKICController.PageDiv ).append(filter);
				$('#' + TKICController.PageDiv ).append(filterEquipment);
				$('#' + TKICController.PageDiv ).append(searchBlock);
				$("#" + TKICController.PageDiv).append(TKIC_List);
				//$.when(
				$("#" + TKICController.PageDiv).trigger("create");
				/*).done(function(){
					$('#filter-equipment').click(function(event){
						TKICController.filterEquipment();
					});					
				});
				*/
				isRendering = false;
				EnableSwipe();
				//DisableSwipe();
			}
		}
		catch(err){
			LOG.handle(err,"If Error is 'Cannot read 0...' then you just clicked Document subtab 2+ times\nerror=[" + err.message + " ]",TKIC_TmpData);
		}
	};
	
	
	//--------------- ORDER -------------
	//MC ordering for different types of documents: last downloaded on top, subtype according defined map for each type of document, lates on top according Date__c
	function getOrderBy(orderList){		
		var orderby =  "";
		try{
			orderby =  " ORDER BY Case when kav.{"+SOUP_TI_ARTICLE_KAV+":Extension} <> 'undefined' THEN kav.{"+SOUP_TI_ARTICLE_KAV+":_soupLastModifiedDate} END desc, ";
			if (orderList.length > 0){		
				orderby += "CASE kav.{"+SOUP_TI_ARTICLE_KAV+":SubType__c} ";			
				for (var i=0; i<orderList.length;i++){				
					orderby += " WHEN '"+orderList[i]+"' THEN "+(i+1);				
				}
				orderby +=" ELSE kav.{"+SOUP_TI_ARTICLE_KAV+":SubType__c} END, ";			
			}
			orderby += "kav.{"+SOUP_TI_ARTICLE_KAV+":Date__c} DESC ";	
		}
		catch(err){
			LOG.handle(err,"TKIC Controller - getOrderBy Error: [ " + err.message + " ]",orderList);
			return "";
		}
		return orderby;
	}
	
	//--------------- FILTER -------------
	//MC function generates string which is added to the query into where clause
	function addFilterSubtypes(selectedSubtypeValues){		
		var filter =  "";
		try{
			
			if ((selectedSubtypeValues['All Documents'] === "") || (selectedSubtypeValues['All Documents'] === undefined)){				
								
				var size = Object.keys(selectedSubtypeValues).length;
				if (size > 0){
					filter =  " AND ("; 
					var lastItem = selectedSubtypeValues[Object.keys(selectedSubtypeValues)[Object.keys(selectedSubtypeValues).length - 1]];					
					for(var value in selectedSubtypeValues){
						if(selectedSubtypeValues.hasOwnProperty(value)){							
							if(value != 'Other')
								filter += " kav.{"+SOUP_TI_ARTICLE_KAV+":SubType__c} = '"+selectedSubtypeValues[value]+"' ";
							else
								filter += " kav.{"+SOUP_TI_ARTICLE_KAV+":SubType__c} = 'null' ";
							if (lastItem!==value)
								filter +=" OR ";
						}						
					}	
					filter +=  ")"; 						
				}			
			}
		}
		catch(err){
			LOG.handle(err,"TKIC Controller - addFilterSubtypes Error: [ " + err.message + " ]",selectedSubtypeValues);
			return "";
		}
		
		return filter;
	}

	
	//MC
	function generateFilterComponent(selectedSubtypeValues){
		var filter = $("<div class='document' ></div>");	
		try{
			var SubTypesMap = {"All Documents":"All Documents"};
			if(Parameters.FileType == 'ASI')
				SubTypesMap = ASI_SubTypesMap;
			else if(Parameters.FileType == 'MAN')
				SubTypesMap = MAN_SubTypesMap;
			else if(Parameters.FileType == 'SPC')
				SubTypesMap = SPC_SubTypesMap;

			var generatedOptionsFilter = generateOptions(SubTypesMap, selectedSubtypeValues);	
				var selection_filter = $('<select required="required" multiple id="filter-'+Parameters.FileType+'" name="select-native-1" class="sharp-corners" '+
												' onchange = "TKICController.filterSubtype();"> '+
											generatedOptionsFilter+
									' </select>'
			);
			filter.append(selection_filter);
		}
		catch(err){
			logToConsole()("getOrderBy Error: [ " + err.message + " ]");
			return "";
		}
		return filter;
	}

	//MC
	function generateFilterEquipmentComponent(selectedEquipmentId){
		var filter = $("<div class='document' ></div>");				
		try{
			var	selectedEquipMap = {};
			selectedEquipMap[selectedEquipmentId]=TKIC_EquipmentMap[selectedEquipmentId];
			//alert('selectedEquipMap '+JSON.stringify(selectedEquipMap));
			//alert('SelectedEquipment in selectedEquipmentId '+selectedEquipmentId);
			var equipmentsMap = TKIC_EquipmentMap;

			var generatedOptionsFilter = generateOptionsForEquipment(equipmentsMap, selectedEquipMap);			
			var selection_filter = $('<select id="filter-equipment-'+Parameters.FileType+'" name="select-native-1" class="sharp-corners"'+
											//' data-native-menu="false" data-placeholder="true" > '+		
											' onchange = "TKICController.filterEquipment();"> '+												
											generatedOptionsFilter+
									' </select>'
			);
			filter.append(selection_filter);
		}
		catch(err){
			LOG.handle(err,"TKICController generateFilterEquipmentComponent Error: " + err.message,selectedEquipmentId);
			return "";
		}	
		return filter;
	}
	
	//MC function get map <value,label> and creates options tags
	function generateOptions(selectOptions, selectedOptions){
		var generatedOptions = "";				
		try{
			if ((selectedOptions === undefined) || (selectedOptions === null)){
				selectedOptions = {};
			} 						
			for(var key in selectOptions){
				if(selectOptions.hasOwnProperty(key)){
					var value = selectOptions[key];
					var selected = '';
					if(selectedOptions[key] == value){
						selected = ' selected="selected" ';
					}					
					generatedOptions += '<option ' + selected + ' value="' + key + '" >' + value + '</option>';
				}
			}			
		}catch(err){
			LOG.handle(err,"TKICController generateOptions Error: " + err.message,selectOptions);			
		}
			
		return generatedOptions;
	}
	
	//MC function get map <value,label> and creates options tags
	function generateOptionsForEquipment(selectOptions, selectedOptions){
		var generatedOptions = "";
		var optionsDownloaded = "";
		var optionsNotDownloaded = "";
		//if(isEquipment)
			//generatedOptions += '<option value="">Filter Equipment</option>';
		//else 
			//generatedOptions += '<option value="">Filter Subtype</option>';
		try{
			if ((selectedOptions === undefined) || (selectedOptions === null)){
				selectedOptions = {};
			} 
						
			for(var key in selectOptions){
				if(selectOptions.hasOwnProperty(key)){
					var value = selectOptions[key];
					var selected = '';
					if(selectedOptions[key] == value){
						selected = ' selected="selected" ';
					}
					if(TKIC_DownloadedEquipmentList.indexOf(key)==-1)
						optionsNotDownloaded += '<option ' + selected + ' value="' + key + '" >' + value + '</option>';
					else
						optionsDownloaded += '<option ' + selected + ' value="' + key + '" >' + value + '</option>';
				}
			}
			
			generatedOptions += '<optgroup label="Downloaded">';
			generatedOptions += optionsDownloaded;
			generatedOptions += '</optgroup>';
			generatedOptions += '<optgroup label="Not Downloaded">';
			generatedOptions += optionsNotDownloaded;
			generatedOptions += '</optgroup>';
		}catch(err){
			LOG.handle(err,"TKICController generateOptionsForEquipment Error: " + err.message,selectOptions);			
		}		
		return generatedOptions;
	}
	
	//MC 
	this.filterSubtype = function(){		
		TKICController.SelectedSubtypeValues = {};
		try{
			var selection_subtype = document.getElementById('filter-'+Parameters.FileType);									
			
			var count = $('#filter-'+Parameters.FileType+' option:selected').length;
			if(count === 0)
				TKICController.SelectedSubtypeValues['All Documents']='All Documents';			
			else
				for (var i = 0; i < selection_subtype.length; i++) {
					if (selection_subtype.options[i].selected) 
						TKICController.SelectedSubtypeValues[selection_subtype.options[i].value]=(selection_subtype.options[i].value);
				}
			if((count>1) && (TKICController.SelectedSubtypeValues['All Documents']=='All Documents'))
				delete TKICController.SelectedSubtypeValues['All Documents'];			
			TKICController.Constructor(Parameters);			
		}		
		catch(err){
			LOG.handle(err,"filterSubtype Error: [ " + err.message + " ]");		
		}		
	};
	
	
	//MC 
	this.filterEquipment = function(){	
		//alert('SelectedEquipment in filterEquipment '+TKICController.SelectedEquipment);
		try{		
			var equipmentFilter = document.getElementById('filter-equipment-'+Parameters.FileType); 
			//alert('in filterEquipment selected value='+equipmentFilter.options[equipmentFilter.selectedIndex].value);
			var count = $('#filter-equipment-'+Parameters.FileType+' option:selected').length;
			if((count > 0) && (equipmentFilter.options[equipmentFilter.selectedIndex].value!=="")){	//redo				
				var selectedEquipId = equipmentFilter.options[equipmentFilter.selectedIndex].value;
				TKICController.SelectedEquipment = selectedEquipId;
				//alert('SelectedEquipment in filterEquipment '+TKICController.SelectedEquipment);				
				if(TKIC_DownloadedEquipmentList.indexOf(selectedEquipId)==-1){
					// Show loading gif
					setTimeout(function(){
						$.mobile.loading('show');
					}, 1); 
					FileManager.downloadDocsOfThisEquip(selectedEquipId);
				}
				else {							
					TKICController.Constructor(Parameters);					
				}			
			}		
		}		
		catch(err){			
			LOG.handle(err,"filterEquipment Error: [ " + err.message + " ]");				
		}		
	};

	this.PushEquipmentId = function(equipId){		
		// Hide loading gif
		setTimeout(function(){
			$.mobile.loading('hide');
		}, 1);			
		TKIC_DownloadedEquipmentList.push(equipId);
		localStorage.setItem(LOCAL_STORAGE_EQUIPMENT, JSON.stringify(TKIC_DownloadedEquipmentList));
	};
	
	//--------------- SEARCH -------------
	function generateSearchBlock(){
		document.getElementById("search-popup-submit").onclick = function(){
			$("#search-popup").popup("close");
			TKICController.Constructor(Parameters);
		};
		
		document.getElementById("search-popup-input-box").onkeyup = function (event) {
				if (event.keyCode === 13) {			   
				   $("#search-popup").popup("close");
				   TKICController.Constructor(Parameters);
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
					result += " AND upper({"+SOUP_TI_ARTICLE_KAV+":Title}) LIKE '%"+searchText.toUpperCase()+"%'";
				}
				 document.getElementById("search-popup-input-box").value = '';
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not compile search text");
		}
		return result;
	}
	
	//--------------- CHECK DOWNOADED TKIC -------------
	this.checkDownloadedTKICs = function(){
		try{
			var querySpec = sfSmartstore().buildSmartQuerySpec("SELECT kav.{"+SOUP_TI_ARTICLE_KAV+":_soup} FROM {"+SOUP_TI_ARTICLE_KAV+"} as kav", 2000);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				prepareTKICs4Checking(cursor.currentPageOrderedEntries);
			},function(error){
				LOG.handle(error,"SmartStore Error when querying all TKICs");
			});
		}
		catch(Pokemon){
			LOG.handle(Pokemon,"Could not correctly check if TKICs are downloaded");
		}
	};

	function prepareTKICs4Checking(response){
		try{
			if(response !== undefined && response !== null && response.length > 0){
				TKIC_UpsertList = [];
				TKIC_TmpData = response;
				TKIC_Index = 0;
				var entry = TKIC_TmpData[TKIC_Index];
				var AVId = entry[0].Article_Version_Id__c;
				var name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var ext = getExtension(entry[0]);
				var filePath = DEFAULT_FILE_PATH+"["+AVId+"]"+name+ext;
				window.resolveLocalFileSystemURL(filePath, markForUpsert, parseNextTKIC);
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not prepare TKICs for checking");
		}
	}

	function getExtension(record){
		var extension = '',splitted;
		try{
			extension = getFieldWithFileExtension(record);
			splitted = extension.split('.');
			return '.'+splitted[splitted.length-1];
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not get Extension of "+JSON.stringify(record));
		}
	}

	function getFieldWithFileExtension(record){
		var extension = '';
		try{
			if(notBlank(record.Extension)){
				return record.Extension;
			}
			if(notBlank(record.Bulletin_Document__Name__s)){
				return record.Bulletin_Document__Name__s;
			}
			if(notBlank(record.PDF_File__Name__s)){
				return record.PDF_File__Name__s;
			}
			if(notBlank(record.HTML_File__Name__s)){
				return record.HTML_File__Name__s;
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not get Extension of "+JSON.stringify(record));
		}
		return extension;
	}

	function notBlank(field){
		return (field !== undefined) && (field !== null) && (field !== ''); 
	}

	function markForUpsert(){
		try{
			var entry = TKIC_TmpData[TKIC_Index];
			var ext = getExtension(entry[0]);
			entry[0].Extension = ext;
			TKIC_UpsertList.push(entry[0]);
			parseNextTKIC();
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not mark for Upsert");
		}
	}

	function parseNextTKIC(){
		try{
			TKIC_Index++;
			if(TKIC_Index < TKIC_TmpData.length)
			{
				var entry = TKIC_TmpData[TKIC_Index];
				var AVId = entry[0].Article_Version_Id__c;
				var name = checkFieldValue(entry[0].Title,"string");
				name = name.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				var ext = getExtension(entry[0]);
				var FileName = "["+AVId+"]"+name+ext;
				var filePath = DEFAULT_FILE_PATH+FileName;
				window.resolveLocalFileSystemURL(filePath, markForUpsert, parseNextTKIC);
			}else{
				upsertTKICExtensions();
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not parse next TKIC");
		}
	}

	function upsertTKICExtensions(){
		try{
			if(TKIC_UpsertList.length > 0){
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_TI_ARTICLE_KAV, TKIC_UpsertList, "Id",function(){
					LOG.say("Successfully found and refreshed "+TKIC_UpsertList.length+" TKICs");
				},function(error){
					LOG.handle(error,"Could not modify TKICs in SmartStore",TKIC_UpsertList);
				});
			}
		}catch(Pokemon){
			LOG.handle(Pokemon,"Could not upsert TKICs with Extensions",TKIC_UpsertList);
		}
	}

}