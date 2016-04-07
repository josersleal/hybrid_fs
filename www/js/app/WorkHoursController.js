/*
  @Author: Martin Opaterny, 
  @email: martin.opaterny@accenture.com, 
  @Version: 1.0
  @LastModified: 13.10.2015 - Denis Ivancik
  @Description: Controller for Work Hours page
  @WARNING:  it's over nine hundred lines of code
 */

var WorkHours = new WorkHour();

function WorkHour(){

	var RecordId = "";// Id of actually selected Service Order
	var Parameters = {};
	var Data = {InstallationId:"", ServiceOrdersIDs:{}, Resources:{}, TimeReports:{}, TimeEntries:{}, WorkedHours:{}};
	var DataMap = {};	// Data and DataMap store actual data in memory, organized structure
	var CLASS_NAME = "WorkHoursController.js";
	var latestFirst = true; //order of Work Hours by Date, chronologically or not
	var vars = {};	// storage for working variables, to reduce heap stack and allocated memory when using asynchronous/recursive functions
	var commentsLimit = 26;
	
	
	this.WorkHoursController = function(parameters) {
		try{
			var wh_tab = $("#hrs-list");
			ClearWorkHours();
			if(parameters !== undefined){
				wh_tab.html("<p>Loading Work Hours...</p>");
				wh_tab.trigger("create");
				Parameters = parameters;
				RecordId = parameters.RecordId;
				getSmartStoreDataPart1();
			}else{
				wh_tab.html("<p>No entries yet...</p>");
				wh_tab.trigger("create");
			}
		}catch(err){
			LOG.store(err,parameters);
		}
	};

	/* deletes old data and cleans variables for next use */
	function ClearWorkHours(){
		try {
			RecordId = "";
			Parameters = {};
			Data = {InstallationId:"", ServiceOrdersIDs:{},Resources:{},TimeReports:{},TimeEntries:{},WorkedHours:{}};
			DataMap = {};
			delete vars.selectedOrders;
		} catch (err) {
			LOG.store(err);
		}
	}

	/* In first part we get Installation + Service Orders from SmartStore */
	function getSmartStoreDataPart1(){
		try{
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var sWHERE = SQL_PARAMS.WHERE;
			var replaceParams = {
				VariableType : "String",
				ReplaceValue : ":RecordId",
				VariableValue : RecordId
			};
			var QUERY = SQL_PARAMS.SQL + ReplaceSQLParameters(sWHERE, replaceParams) + SQL_PARAMS.ORDERBY;

			logToConsole()("SQLite for  [ " + QUERY + " ]");

			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(querySpec,
				function(cursor) {
					getSmartStoreDataPart2(cursor.currentPageOrderedEntries);
				},function(error){
					LOG.store(error,querySpec);
			});
		} catch (err) {
			LOG.store(err);
		}
	}

	/* In second part we obtain Time Registrations for related Service Orders */
	function getSmartStoreDataPart2(response){
		try{
			parseReceivedResources(response);
			var serviceIdList = createListOfServiceOrders();
			var SQL_PARAMS = SQLTable["SQLITE_TIME_REGISTRATIONS"];
			var sWHERE = SQL_PARAMS.WHERE;
			var replaceParams = {
				Ids : [],
				VariableType : "String",
				ReplaceValue : ":ParentIds",
				VariableValue : serviceIdList
			};
			// Denis Ivancik, reduced variables
			var QUERY = SQL_PARAMS.SQL + ReplaceSQLParameters(sWHERE, replaceParams) + SQL_PARAMS.ORDERBY;

			logToConsole()(	"SQLite for  [ " + QUERY + " ]");

			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(
				querySpec,
				function(cursor) {
					parseTimeRegistrations(cursor.currentPageOrderedEntries);
					onSuccessWHDataRetrieve2();						
			},function(error){
				LOG.store(error,querySpec);
			});
		} catch (err) {
			LOG.store(err,response);
		}
	}

	/* Denis Ivancik 9.9.2015 This function retrieves assigned resources, 
	 installation Id and service orders. */
	function parseReceivedResources(input){
		try{
			if(input !== undefined && input !== null && input.length > 0){
				for(var i=0, j=input.length; i<j;i++){
					var entry = input[i];
					if(Data.InstallationId === "" && entry[0]!==null && entry[0]!==""){
						Data.InstallationId = entry[0];// there should be queried only one installation Id
					}
					if(entry[1] && entry[2] && entry[3] && entry[1] == RecordId){
						var WOnumber = entry[2];
						var middleFlag = true;
						if(WOnumber === undefined || WOnumber === null || WOnumber === "null"){
							WOnumber = "";
							middleFlag = false;
						}
						var WOtitle = entry[3];
						if(WOtitle === undefined || WOtitle === null || WOtitle === "null"){
							WOtitle = "";
							middleFlag = false;
						}
						if(middleFlag){
							Data.ServiceOrdersIDs[entry[1]] = WOnumber+" - "+WOtitle;
						}else{
							Data.ServiceOrdersIDs[entry[1]] = WOnumber + WOtitle;
						}
					}				
					if(entry[4] && entry[5]){
						Data.Resources[entry[4]] = entry[5];
					}
					vars.Installation_Name = entry[6];
				}
			}
			else{
				alert('Class ' + CLASS_NAME + ', parseReceivedResources method received empty input.\n'+
					  'Be sure that this Service Order has filled Installation_Id field.');
			}
		}catch(err){
			LOG.store(err,input);
		}
	}

	/* Denis Ivancik 9.9.2015 This function creates stringed list of Service Order IDs */
	function createListOfServiceOrders(){
		var result = "";
		try{
			for(var key in Data.ServiceOrdersIDs){
				if(Data.ServiceOrdersIDs.hasOwnProperty(key)){
					if(result !==""){
						result += ",";
					}
					result += "'"+key+"'";
				}
			}
		}catch(err){
			LOG.store(err);
		}
		return result;
	}

	/* Denis Ivancik 9.9.2015 This function retrieves Time Reports, entries and Work hours */
	function parseTimeRegistrations(input){
		try{
			if(input !== undefined && input !== null && input.length > 0){
				for(var i=0, j=input.length; i<j;i++){
					var entry = input[i];
					if(entry[0]){
						var tr = JSON.parse(entry[0]);
						Data.TimeReports[tr.Id] = tr;
					}
					if(entry[1]){
						var te = JSON.parse(entry[1]);
						if(te){
							Data.TimeEntries[te.Id] = te;
						}
					}
					if(entry[2]){												
						var wh = JSON.parse(entry[2]);
						if(wh){
							Data.WorkedHours[wh.Id] = wh;
						}
					}
				}
			}
		}catch(err){
			LOG.store(err,input);
		}
	}

	// TODO - Denis, rework this function
	function onSuccessWHDataRetrieve2() {
		try {
			generateTimeReportMap();
			var main_holder = $("#hrs-list");
			main_holder.html("");
			if (DataMap !== undefined && DataMap !== null) {
				// Sort By Reported Date
				var RepDateList = [];
				for(var ReportedDate in DataMap) {
					if(DataMap.hasOwnProperty(ReportedDate)){
						RepDateList.push(ReportedDate);
					}
				}
				RepDateList.sort();
				if(latestFirst){
					RepDateList.reverse();
				}
				for(var i=0,j=RepDateList.length;i<j;i++){
					main_holder.append(createTimeReportElement(RepDateList[i]));
					main_holder.trigger("create");
				}
			}
			// Display Current Date, Insert Working Hours, Customer Approval
			var insert_new_wh = $('<div class="list-item" style="text-align:left;"></div>');
			var anchorHTML = '<a id="new____isNew" style="width:100%;" data-rel="popup"';
			anchorHTML += ' data-position-to="window" onclick="WorkHours.WorkHoursPopUp(this)"';
			anchorHTML += ' aria-owns="#service-order-popup" aria-haspopup="true"></a>';
			var anchor = $(anchorHTML);
			var now = new Date();
			now = DateTimeObject.fullDate(now);
			now = $('<p style="font-size: 180%;text-align:left;" class="no-margin no-padding">'+
					 now +'</p>');
			anchor.append(now);
			var img_insert = $('<img src="images/icons/add-button-34.png" style="vertical-align:middle;" />');
			anchor.append(img_insert);
			var insert_text = $('<span style="font-size: 125%;padding-left:6px;font-weight:normal;">Insert working hours</span>');
			anchor.append(insert_text);

			insert_new_wh.append(anchor);
			main_holder.append(insert_new_wh);
			
			var customer_approval_HTML = '<a id="btnCustomerApproval"';
			customer_approval_HTML += ' class="operations-popup-button reset-styles "'; //list-item
			customer_approval_HTML += ' style="text-align:center;"';
			customer_approval_HTML += ' data-rel="popup" data-position-to="window" data-inline="true"';
			customer_approval_HTML += ' data-transition="pop" data-corners="true" data-shadow="true"';
			customer_approval_HTML += ' data-iconshadow="true" data-wrapperels="span" data-theme="c"';
			customer_approval_HTML += ' onclick="WorkHours.customerApprovalPopup();"';
			customer_approval_HTML += ' aria-haspopup="true" aria-owns="#work-hours-approval-popup">';
			customer_approval_HTML += '<br/><button class="ui-btn ui-btn-inline wartsila-btn orange">';
			customer_approval_HTML += 'Customer Approval</button></a>';
			var customer_approval = $(customer_approval_HTML);

			main_holder.append(customer_approval);
			main_holder.trigger("create");
		}catch(err){
			LOG.store(err);
		}
	}

	/* Denis Ivancik 9.9.2015 Transform Data.TR/TE/WH into Map<TR.Id,Map<TE.Id,WH>> */
	function generateTimeReportMap(){
		try{
			for (var WH_ID in Data.WorkedHours) {
				if (Data.WorkedHours.hasOwnProperty(WH_ID)) {
					var tmp_WH = Data.WorkedHours[WH_ID];
					if(validWorkHour(tmp_WH)){
						var WH_item = fillWorkHourItem(tmp_WH);
						// find parent (TE), grandparent (TR) and check if they are in DataMap {}
						findWHparentAndGrandparent(WH_item);
					}else{
						alert(CLASS_NAME+", generateTimeReportMap:\nNot valid Work_Hour record:\n"+JSON.stringify(tmp_WH));
					}
				}
				else{
					alert(CLASS_NAME+", generateTimeReportMap:\nWork Hour Id problem: "+WH_ID);
				}
			}
		}catch(err){
			LOG.store(err);
		}
	}

	/* check if this Work Hour has defined required fields */
	function validWorkHour(input){
		var Result = true;
		try{
			if(input){/*&& input.Start_Time__c !== null*/ /*&& input.End_Time__c !== null*/
				if((input.Start_Time__c !== undefined )	&& (input.End_Time__c !== undefined )
					&&(input.Reported_Hours__c !== undefined && input.Reported_Hours__c !== null)
					&&(input.Time_Entry__c !== undefined && input.Time_Entry__c !== null && input.Time_Entry__c !== ""))
				{
					//everything seems fine, TODO: improve validation
					Result = true;
				}else{
					// Required fields are blank
					Result = false;
				}
			}else{
				// Blank Input
				Result = false;
			}
		}catch(err){
			LOG.store(err,input);
			Result = false;
		}
		return Result;
	}

	/* this is helpful function that will store Work Hours info into variable */
	function fillWorkHourItem(originalWorkHour){
		try{
			var Result = jQuery.extend(true, {}, WORK_HOUR_ITEM);
			Result.Id = checkFieldValue(originalWorkHour.Id,"string");
			Result.Iime_Entry_Id = checkFieldValue(originalWorkHour.Time_Entry__c,"string");//unused
			Result.Time_Report_Id = checkFieldValue(Data.TimeEntries[originalWorkHour.Time_Entry__c].Time_Report__c,"string");
			//Result.Service_Order_ID = checkFieldValue(Data.TimeReports[Result.Time_Report_Id].Service_Order__c,"string");
			Result.Reported_Hours__c = checkFieldValue(originalWorkHour.Reported_Hours__c,"integer");
			Result.Start_Time__c = checkFieldValue(originalWorkHour.Start_Time__c,"string");
			Result.End_Time__c = checkFieldValue(originalWorkHour.End_Time__c,"string");
			Result.Location__c = checkFieldValue(originalWorkHour.Location__c,"string");
			Result.Type__c = checkFieldValue(originalWorkHour.Type__c,"string");
			Result.Comments__c = checkFieldValue(originalWorkHour.Comments__c,"string");
			return Result;
		}catch(err){
			LOG.store(err,originalWorkHour);
		}
	}

	/* this function finds (parent) Time Entry ID and (grandparent) Time Report ID of WH_item record 
	   then it will append DataMap{} with new entry line (WH_item and parent's details) */
	function findWHparentAndGrandparent(WH_item){
		try{
			// search for Parent of this Work Hour
			var WH_parent_TE = Data.WorkedHours[WH_item.Id]; // Work Hour record
			if(WH_parent_TE !== undefined && WH_parent_TE !== null){
				WH_parent_TE = WH_parent_TE.Time_Entry__c;	 // Time Entry Id
				WH_item.Time_Entry_Id = WH_parent_TE; // I store it for future updates

				var WH_parent_TR = Data.TimeEntries[WH_parent_TE];	// parent Time Entry
				// and now, validation against blank results
				if(WH_parent_TR !== undefined && WH_parent_TR !== null){
					WH_parent_TR = WH_parent_TR.Time_Report__c; // grandparent Id
					WH_item.Time_Report_Id = WH_parent_TR; // I store it for future updates
					if(WH_parent_TR !== undefined && WH_parent_TR !== null && WH_parent_TR !== ""){
						// Now we can continue, because we are sure that this Work Hour has
						// parent and grandparent record
						generateTimeReportMapLineItem(WH_item);
					}//else grandparent Id is blank, so skip it
					else{
						alert(CLASS_NAME+", findWHparentAndGrandparent:\nWH_parent_TR Id is blank for WorkHour:\n"+JSON.stringify(WH_item));
					}
				}// else skip this Work Hour, because it does not have grandparent Time Report
				else{
					alert(CLASS_NAME+", findWHparentAndGrandparent:\nData.TimeEntries["+WH_parent_TE+"] is blank.\n"+JSON.stringify(WH_item));
				}
			}else{
				alert(CLASS_NAME+", findWHparentAndGrandparent:\nData.WorkedHours["+WH_item.Id+"] is "+WH_parent_TE);
			}
		}catch(err){
			LOG.store(err,WH_item);
		}
	}

	/* this function appends DataMap{} with new entry line, which will be used in graphical generation of Work Hours page */
	function generateTimeReportMapLineItem(WH_item){
		try{
			// [Reported Date] -> [Resorce Name] -> [Work Hour item]
			var reportedDate = Data.TimeReports[WH_item.Time_Report_Id].Report_Date__c;
			var resourceID = Data.TimeEntries[WH_item.Time_Entry_Id].Resource__c;
			var resourceName = Data.Resources[resourceID];
			var reportedHours = parseFloat(WH_item.Reported_Hours__c);
			
			var MapLine = DataMap[reportedDate];
			var MapLineEntry;
			if(MapLine){
				MapLineEntry = MapLine.Time_Entry_Items[resourceID];

				if(MapLineEntry){
					MapLineEntry.Work_Hour_Items.push(WH_item);
					MapLineEntry.Reported_Hours_Sum += reportedHours;

					MapLine.Reported_Hours_Total += reportedHours;
				}else{
					MapLineEntry = jQuery.extend(true,{},TIME_ENTRY_ITEM);
					MapLineEntry.Work_Hour_Items.push(WH_item);
					MapLineEntry.Reported_Hours_Sum = reportedHours;
					MapLineEntry.Resource_Name = resourceName;

					MapLine.Reported_Hours_Total += reportedHours;
					MapLine.Time_Entry_Items[resourceID] = MapLineEntry;
				}
			}else{
				MapLineEntry = jQuery.extend(true,{},TIME_ENTRY_ITEM);
				MapLineEntry.Work_Hour_Items.push(WH_item);
				MapLineEntry.Reported_Hours_Sum = reportedHours;
				MapLineEntry.Resource_Name = resourceName;

				MapLine = jQuery.extend(true,{},TIME_REPORT_ITEM);
				MapLine.Reported_Hours_Total = reportedHours;
				MapLine.Report_Date = reportedDate;
				MapLine.Time_Entry_Items[resourceID] = MapLineEntry;

				DataMap[reportedDate] = MapLine;
			}
		}catch(err){
			LOG.store(err,WH_item);
		}
	}

	/* Creates HTML element - a Date as title, with all Time Entries from this day (ReportedDate) */
	function createTimeReportElement(ReportedDate){
		try{
			var timeReport = DataMap[ReportedDate];
			var timeReportElement = $('<div class="list-item no-padding no-margin"></div>');
			var date_head = $('<h2 class="date-head no-margin no-padding">' + DateTimeObject.toEuropeanFormat(ReportedDate)+ '</h2>');
			timeReportElement.append(date_head);
			// sort by Name of Engineer (Resource)
			var NameList = [];
			var NameToIDMap = {};
			var resourceName;
			for(var resourceID in timeReport.Time_Entry_Items){
				if(timeReport.Time_Entry_Items.hasOwnProperty(resourceID)){
					resourceName = timeReport.Time_Entry_Items[resourceID].Resource_Name;
					NameList.push(resourceName+resourceID);	
					NameToIDMap[resourceName+resourceID] = resourceID;
				}
			}
			NameList.sort();
			// generate all Time Entries from this day
			for(var i=0,j=NameList.length;i<j;i++){
				var resID = NameToIDMap[NameList[i]];
				resourceName = timeReport.Time_Entry_Items[resID].Resource_Name;
				timeReportElement.append(createTimeEntryElement(timeReport.Time_Entry_Items[resID],resourceName));
			}
			return timeReportElement;
		}catch(err){
			LOG.store(err,ReportedDate);
		}
	}

	/* Creates HTML element - a row with Selected Resource (name of Engineer) */
	function createTimeEntryElement(timeEntry,resourceName){
		try{
			var timeEntryElement = $('<div class="header no-padding no-margin"></div>');
			var name_head = $('<h3 class="name no-margin no-padding">'+resourceName+'</h3>');
			//var sum_head = $('<h3 class="total-hours no-margin no-padding">'+DateTimeObject.TimeDecimalToHHMM(timeEntry.Reported_Hours_Sum)+'</h3>');
			var clear_both = $('<div class="clear-both"></div>');
			timeEntryElement.append(name_head);
			//timeEntryElement.append(sum_head); // don't delete it, because client may change his mind about 'Sum of Reported hours' next to Engineer's name
			timeEntryElement.append(clear_both);
			for(var i=0,j=timeEntry.Work_Hour_Items.length; i<j;i++){
				// Show list of Work hours under his name
				timeEntryElement.append(createWorkHourElement(timeEntry.Work_Hour_Items[i]));
			}
			return timeEntryElement;
		}catch(err){
			LOG.store(err,{"timeEntry":timeEntry,"resourceName":resourceName});
		}
	}

	/* Creates HTML element - a row with Work Type (e.g. Overtime) and with Start/End Time */
	function createWorkHourElement(workHour){
		try{
			var anchorHTML = '<a id="new____isNew" style="width:100%;"';
			anchorHTML += ' data-transition="pop" data-position-to="window" onclick = "WorkHours.WorkHourEditPopUp(\'' + workHour.Id + '\');"';
			anchorHTML += ' aria-owns="#service-order-popup" aria-haspopup="true"></a>';
			var anchor = $(anchorHTML);
			/*
			var workHourElement = $(
				'<a href="#service-order-popup" id = "' + workHour.Id + '" onclick = "WorkHours.WorkHourEditPopUp(\'' + workHour.Id + '\');" '+
				'class="operations-popup-button reset-styles" aria-haspopup="true">' +
				'<div  class="hours-entry"></div></a>');
			*/
			var workHourElement = $('<div  class="hours-entry"></div></a>');
			var workHourElement_type = $('<p class="work-type no-margin no-padding large">'+ workHour.Type__c + DOTS + '</p>');
			workHourElement.append(workHourElement_type);
			var workHourElement_time;
			if((workHour.Start_Time__c === "")||(workHour.End_Time__c === "")){
				// display Reported hours when Start/End is not defined, to support data from old version
				workHourElement_time = $('<p class="hours no-margin no-padding large">'+ DateTimeObject.TimeDecimalToHHMM(workHour.Reported_Hours__c)+ DOTS + '</p>');
			}else{
				// display Start - End time
				workHourElement_time = $('<p class="hours no-margin no-padding large">'+ workHour.Start_Time__c + '-'+ workHour.End_Time__c + DOTS + '</p>');
			}
			workHourElement.append(workHourElement_time);
			var workHourElement_clearboth = $('<div class="clear-both"></div>');
			workHourElement.append(workHourElement_clearboth);
			anchor.append(workHourElement);
			return anchor;
		}catch(err){
			LOG.store(err,workHour);
		}
	}

	/* triggered when WorkHoursPopUp is opened on workingHours tab via (+) button */
	this.WorkHoursPopUp = function(element, id) {
		try{
			var ID = '';
			if(id){
				ID = id;
			}else{
				ID = $(element).attr("id");
				var element_ID = ID.split(API_VALUE_SEPARATOR);
				if ((!isNaN(element_ID)) && (element_ID.length > 1)) {
					ID = element_ID[1];
				}
			}
			if(ID){
				Parameters.Ids = [];
				Parameters.SQL = "SQLITE_WORK_HOURS_DETAIL";
				Parameters.Page = DIV_SERVICE_ORDER_WORK_HOURS_POPUP;
				WorkHours.getSmartStoreData();
			}
		}catch(err){
			LOG.store(err,{"element":element,"id":id});
		}
	};

	/* gets data from SmartStore for NEW work hours pop-up */
	this.getSmartStoreData = function() {
		try {
			var SQL_PARAMS = SQLTable[Parameters.SQL];
			var sWHERE = SQL_PARAMS.WHERE;
			var replaceParams = {
				VariableType : "String",
				ReplaceValue : ":RecordId",
				VariableValue : RecordId
			};
			var QUERY = SQL_PARAMS.SQL + ReplaceSQLParameters(sWHERE, replaceParams) + SQL_PARAMS.ORDERBY;
			logToConsole()("SQLite for  [ " + QUERY + " ]");

			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(querySpec,function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				drawNewWorkHourPopup(page);
			},function(error){
				LOG.store(error);
			});
		}catch(err){
			LOG.store(err);
		}
	};

	/* This will draw pop-up for entering a new work hours */
	function drawNewWorkHourPopup(response) {
		try{
			var div_content,locResponse;
			if ((Parameters !== undefined) && (Parameters.Page !== undefined)) {
				switch (Parameters.Page){
					case DIV_SERVICE_ORDER_WORK_HOURS_POPUP:
						div_content = DIV_SERVICE_ORDER_WORK_HOURS_POPUP_CONTAINER;
						locResponse = DataTransManager.DataTrans_ForWorkHoursPopUp(response);
						ActiveAppLocation.Data = locResponse;
						ActiveAppLocation.PageName = PAGE_SERVICEORDER;
						ActiveAppLocation.TabName = PAGE_WORKHOURS;
						ActiveAppLocation.PopUpName = DIV_SERVICE_ORDER_WORK_HOURS_POPUP;
						ActiveAppLocation.RefreshTab = true;
						break;
					default:
						return false;
				}
			}
			// Printing the Day of the week and Date formatted as DD.MM.YYYY
			var now = new Date();
			var element = document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_WEEK);
			if (element !== null) {
				element.innerHTML = DateTimeObject.WeekDay(now);
			}
			element = document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_DATE);
			if (element !== null) {
				element.placeholder = DateTimeObject.fullDate(now);
				element.value = DateTimeObject.DateFormateToStringDB(now,'', 'date');
			}
			// service-order-popup-container
			$("#" + div_content).html("");

			var selection_div = $('<div class="section-frame task-row"></div>');

			// @SUGGESTION move all plain-text to the translation object
			//Denis Ivancik, 11.8.2015,
			/*
			var selection_work_type = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE+
				'" name="select-native-1" id="select-native-1"> '+		
				' </select>'
			); 
			*/
			
			//-----TYPE-----
			var selectOptionsType = {"Normal":"Normal","Overtime A":"Overtime A","Overtime B":"Overtime B","Travel":"Travel","Waiting":"Waiting"};
			var generatedOptionsType = generateOptions(selectOptionsType, "Normal");
			var selection_work_type = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE+
				'" name="select-native-1" class="sharp-corners"> '+generatedOptionsType+' </select>'
			);
			
			//-----LOCATION-----
			var selectOptionsLocation = {"Field Service":"Field Service","Workshop":"Workshop","Offshore":"Offshore"};
			var generatedOptionsLocation = generateOptions(selectOptionsLocation, "Field Service");
			var selection_location_type = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE+
				'" name="select-native-1" class="sharp-corners"> '+generatedOptionsLocation+' </select>'
			);
								
			// TODOJL: account for many resources same work hour entry
			var selection_resource = $('<select multiple id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES+
				'" name="select-native-1" class="sharp-corners" > '+//id="select-native-1"
				' </select>'
			);
			var selected,resNameLC,newRow;
			for(var resId in Data.Resources){
				if(Data.Resources.hasOwnProperty(resId)){
					var resName = Data.Resources[resId];
					selected = ' selected="selected" ';
					resNameLC = resName.toLowerCase().split(' ');
					var userName = MainObject.userData.Name.toLowerCase();
					for(var i=0,j=resNameLC.length;i<j;i++){
						if(userName.indexOf(resNameLC[i])<0){
							selected = '';
						}
					}
					newRow = $('<option ' + selected + ' value="'+ resId + '">' + resName+ '</option>');
					selection_resource.append(newRow);
				}
			}

			// TODO: I guess this was for 'Dynamic '
			for(var keyGroup in locResponse){
				if(locResponse.hasOwnProperty(keyGroup)){
					var key_item = locResponse[keyGroup];
					for (var item in key_item) {
						if(key_item.hasOwnProperty(item)){
							var item_line = key_item[item];
							selected = '';
							switch (keyGroup) {
							case USER_DATA:
								break;
							case TYPE_RESOURCE:
								// TODOJL: account for many resources same work hour entry
								if ((item_line.Data !== undefined) && (item_line.Data.CKSW__User__c == MainObject.userData.Id)) {
									selected = ' selected="selected" ';
								}
								break;
							case TYPE_WORKHOURS:
								if (item_line.sValue == WORK_TYPE_NORMLA) {
									selected = ' selected="selected" ';
								}
								// TODO: Why is this never used? Whats the purpose of it?
								newRow = $('<option '+selected+' value="'+item_line.sValue+'">'+item_line.sValue+'</option>');
								break;
							default:
								break;
							}
						}
					}
				}
			}
			selection_div.append(selection_resource);
			selection_div.append(selection_work_type);
			selection_div.append(selection_location_type);

			var div_save = $(WorkHours.generateTimeInputFields("","","","",""));

			selection_div.append(div_save);
			
			//-----COMMENTS-----
			var div_comments= $('<div id ="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS+'" class = "hidden" ><textarea id="'+TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS
								+'" placeholder="" rows="2" onKeyUp="WorkHours.checkLength(TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS);"></textarea></div>'
			);				
			
			selection_div.append(div_comments);
			var div_hours_HTML = '<div class="output-section">';
			div_hours_HTML += '<h2 class="hours no-margin no-padding">8:00h</h2>';
			div_hours_HTML += '</div>' + '<div class="clear-both"></div>';
			var div_hours = $(div_hours_HTML);
			selection_div.append(div_hours);

			$("#" + div_content).append(selection_div);
			$("#" + div_content).trigger("create");
			$("#service-order-popup").popup("open");
		} catch (err) {
			LOG.store(err);
		}
	}

	//MC 
	this.generateTimeInputFields = function(hrStart, minStart, hrEnd, minEnd, whId){
		var result = '<div class="input-section">';
		result +=	 '<p class="no-margin no-padding ">Insert Start / End Time</p>';
		result +=	 '<table border="0" cellpadding="0" cellspacing="0">';
		result +=	 '<tr>';
		result +=	 '<td>';
		result +=	 '<input type="number" class="sharp-corners" id="';
		result +=	 INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS;
		result +=	 '" name="hoursStart" size="2" min="0" max="23" maxlength="2" onclick="select();" value="'+hrStart+'"';
		result +=	 'onKeyPress="return WorkHours.checkChars(event,value);" ';
		result +=	 'onInput="WorkHours.checkInputValue(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS, true);" ';
		result +=	 'onKeyUp="WorkHours.FocusNext(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS, INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES);" >';				
		result +=	 '</td> ';
		result +=	 '<td><h2 class="no-margin no-padding">:</h2></td> ';
		result +=	 '<td><input type="number" class="sharp-corners" id="';
		result +=	 INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES;
		result +=	 '" name="minutesStart" size="2" min="0" max="59" maxlength="2" onclick="select();" value="'+minStart+'"';
		result +=	 'onKeyPress="return WorkHours.checkChars(event,value);" ';
		result +=	 'onInput="WorkHours.checkInputValue(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES, false);" ';
		result +=	 'onKeyUp="WorkHours.FocusNext(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES, INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS);" >';
		result +=	 '</td>';
		result +=	 '</tr>';
		result +=	 '<tr><td>';
		result +=	 '<input type="number" class="sharp-corners" id="';
		result +=	 INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS;
		result +=	 '" name="hoursEnd" size="2" min="0" max="23" maxlength="2" onclick="select();" value="'+hrEnd+'"';
		result +=	 'onKeyPress="return WorkHours.checkChars(event,value);" ';
		result +=	 'onInput="WorkHours.checkInputValue(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS, true);" ';
		result +=	 'onKeyUp="WorkHours.FocusNext(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS, INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES);" >';
		result +=	 '</td>';
		result +=	 ' <td><h2 class="no-margin no-padding">:</h2></td> ';
		result +=	 ' <td><input type="number" class="sharp-corners" id="';
		result +=	 INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES;
		result +=	 '" name="minutesEnd" size="2" min="0" max="59" maxlength="2" onclick="select();" value="'+minEnd+'"';
		result +=	 'onKeyPress="return WorkHours.checkChars(event,value);" ';
		result +=	 'onInput="return WorkHours.checkInputValue(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES, false);"> ';
		result +=	 '</td> </tr>';
		result +=	 ' </table> ';	
		result +=	 ' <div><span class="align-bottom"> ';
		result +=	 ' <button class="ui-btn ui-btn-inline wartsila-btn orange" onclick="WorkHours.showComment();">Comment</button> ';
		result +=	 ' </span>';
		result +=	 ' <span class="align-bottom"> ';
		result +=	 ' <button class="ui-btn ui-btn-inline wartsila-btn orange" onclick="WorkHours.WorkHoursSaveData2(\''+whId+'\');">Save</button> ';
		result +=	 ' </span> ' + '</div></div> ';
		return result;
	};

	
	this.showComment = function(){
		$('#'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS).show();
	};
	
	//MC function allows to put only number characters into input field
	this.checkChars = function(e,value){
		//Check Character
		var unicode=e.charCode? e.charCode : e.keyCode;
		//if (value.indexOf(".") != -1)if( unicode == 46 )return false;
		if (unicode!=8)if((unicode<48||unicode>57)&&unicode!=46)return false;
	};
	
	//MC function get focus on next input field
	this.FocusNext = function(elementID, nextElementID){
		var fieldLength = document.getElementById(elementID).value.length;
		if(fieldLength == 2){
			document.getElementById(nextElementID).focus();
			document.getElementById(nextElementID).select();
		}
		else if(fieldLength > 2){
			var str = document.getElementById(elementID).value;
			str = str.substring(0, str.length - 1);
			document.getElementById(elementID).value = str;
		}
	};
	
	this.checkLength = function(elementID){
		var fieldLength = document.getElementById(elementID).value.length;
		if(fieldLength > commentsLimit){
			var str = document.getElementById(elementID).value;
			str = str.substring(0, commentsLimit);
			document.getElementById(elementID).value = str;
		}
	};
	
	//MC function restrict more than 2 characters put in input field
	this.checkInputValue = function(elementID,isHours){
		var fieldValue = document.getElementById(elementID).value;
		var fieldLength = document.getElementById(elementID).value.length;
		if (fieldLength == 1){
			var re = new RegExp("[0-9]");
			if (re.test(fieldValue))
				return true;
			else
				document.getElementById(elementID).value = "";
			return false;
		}
		else{
			if (fieldLength > 2){
				fieldValue = fieldValue.substring(0, 2);
				document.getElementById(elementID).value = fieldValue;
			}
			if(isHours){
				var reHours = new RegExp("([01][0-9]|2[0-4])");
				if (reHours.test(fieldValue))
					return true;
				else					
					document.getElementById(elementID).value = "";				
			}
			else{
				var reMinutes = new RegExp("[0-5][0-9]");
				if (reMinutes.test(fieldValue))
					return true;
				else
					document.getElementById(elementID).value = "";				
			}
		}
	};

	//MC function get map <value,label> and creates options tags
	function generateOptions(selectOptions, selectedOption){
		var generatedOptions = "";
		try{
			if ((selectedOption === undefined) || (selectedOption === null)){
				selectedOption = "";
			}
			for(var value in selectOptions){
				if(selectOptions.hasOwnProperty(value)){
					var label = selectOptions[value];
					var selected = '';
					if(selectedOption == value){
						selected = ' selected="selected" ';
					}
					generatedOptions+= '<option ' + selected + ' value="' + value + '">' + label+ '</option>';
				}
			}
		}catch(err){
			LOG.store(err,{"selectOptions":selectOptions,"selectedOption":selectedOption});
		}
		return generatedOptions;
	}
	
	//Maria Ciskova 29.9.2015
	this.WorkHourEditPopUp = function(whID){
		try{
			var div_content;
			div_content = DIV_SERVICE_ORDER_WORK_HOURS_POPUP_CONTAINER;
			var workHourEdit = Data.WorkedHours[whID];
			var timeEntryEdit = Data.TimeEntries[workHourEdit.Time_Entry__c];
			var timeReportEdit = Data.TimeReports[timeEntryEdit.Time_Report__c];
			var element = document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_DATE);
			if (element !== null) {
				element.value = timeReportEdit.Report_Date__c;
			}
			// service-order-popup-container
			$("#" + div_content).html("");
			var selection_div = $('<div class="section-frame task-row"></div>');
			//-----TYPE-----
			var selectOptionsType = {"Normal":"Normal","Overtime A":"Overtime A","Overtime B":"Overtime B","Travel":"Travel","Waiting":"Waiting"};
			var generatedOptionsType = generateOptions(selectOptionsType, workHourEdit.Type__c);
			var selection_work_type = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE+
				'" name="select-native-1" id="select-native-1" class="sharp-corners"> '+
				generatedOptionsType+' </select>'
			);
			//-----LOCATION-----
			var selectOptionsLocation = {"Field Service":"Field Service","Workshop":"Workshop","Offshore":"Offshore"};
			var generatedOptionsLocation = generateOptions(selectOptionsLocation, workHourEdit.Location__c);
			var selection_location_type = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE+
				'" name="select-native-1" id="select-native-1" class="sharp-corners"> '+
					generatedOptionsLocation+' </select>'
			);
			//-----RESOURCE-----
			var generatedOptionsResource = generateOptions(Data.Resources, timeEntryEdit.Resource__c);
			var selection_resource = $('<select id="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES+
				'" name="select-native-1" id="select-native-1" class="sharp-corners"> '+
					generatedOptionsResource+' </select>'
			);
			selection_div.append(selection_resource);
			selection_div.append(selection_work_type);
			selection_div.append(selection_location_type);
			//-----START AND END TIME-----
			var startTime;
			var endTime;
			if ((workHourEdit.Start_Time__c === undefined) || (workHourEdit.Start_Time__c === null))
				startTime = "";
			else 
				startTime = DateTimeObject.GetHoursAndMinutesFromHHMMTime(workHourEdit.Start_Time__c);
			
			if ((workHourEdit.End_Time__c === undefined) || (workHourEdit.End_Time__c === null))
				endTime = "";
			else 
				endTime = DateTimeObject.GetHoursAndMinutesFromHHMMTime(workHourEdit.End_Time__c);
			
			var div_save;	
			div_save = $(WorkHours.generateTimeInputFields(startTime[0],startTime[1],endTime[0],endTime[1],whID));
			selection_div.append(div_save);
			
			//-----COMMENTS-----
			var comment = "";
			var classHidden = 'class = "hidden"';
			if ((workHourEdit.Comments__c !== undefined) && (workHourEdit.Comments__c !== null) && (workHourEdit.Comments__c !== '')){
				comment = workHourEdit.Comments__c;
				classHidden = '';
			}			
			var div_comments= $('<div id ="'+DIV_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS+'" '+classHidden+' ><textarea id="'+TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS
								+'" placeholder="" rows="2" onKeyUp="WorkHours.checkLength(TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS);">' + comment + '</textarea></div>'
			);			
			selection_div.append(div_comments);
			
			var div_hours_HTML = '<div class="output-section"><h2 class="hours no-margin no-padding">8:00h</h2>';
			div_hours_HTML += '</div>' + '<div class="clear-both"></div>';
			var div_hours = $(div_hours_HTML);
			selection_div.append(div_hours);
			$("#" + div_content).append(selection_div);
			$("#" + div_content).trigger("create");
			$("#service-order-popup").popup("open");
		}catch(err){
			LOG.store(err,whID);
		}
	};

	this.ValidateHoursAndMinutes = function(hoursStart, minutesStart, hoursEnd, minutesEnd){
		var allCorrect = true;
		try{
			var errorMessage = '';
			if((hoursStart > 23) || (hoursEnd > 24)){
				allCorrect = false;
				errorMessage += ERROR_HOURS_EXCEEDED + '\n';
			}
			if((hoursEnd == 24) && (minutesEnd > 0)){
				allCorrect = false;
				errorMessage += ERROR_END_OF_DAY_REACHED + '\n';
			}
			if((minutesStart > 59) || (minutesEnd > 59)){
				allCorrect = false;
				errorMessage += ERROR_MINUTES_EXCEEDED + '\n';
			}
			if(hoursEnd < hoursStart){
				allCorrect = false;
				errorMessage += ERROR_END_TIME_BEFORE_START_TIME + '\n';
			}
			if((hoursEnd == hoursStart) && (minutesEnd < minutesStart)){
				
				allCorrect = false;
				errorMessage += ERROR_END_TIME_BEFORE_START_TIME + '\n';
			}
			if((hoursEnd == hoursStart) && (minutesEnd == minutesStart) && ((hoursEnd > 0) || (minutesEnd > 0))){				
				allCorrect = false;
				errorMessage += ERROR_END_TIME_EQUALS_START_TIME + '\n';
			}
			if(!allCorrect){
				alert(errorMessage + "Please, correct your input.");
			}
		}catch(err){
			LOG.store(err,{"hoursStart":hoursStart,"minutesStart":minutesStart,"hoursEnd":hoursEnd,"minutesEnd":minutesEnd});
			allCorrect = false;
		}
		return allCorrect;
	};

	/*Maria Ciskova 21.9.2015 - Checking Selected data on the PopUp before Save */
	this.CheckBeforeSave2 = function(params) {
		try {
			if((params === undefined) || (params === null)) {
				return false;
			}

			// validate if Work Type was selected
			var wtValue = params[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE];
			if ((!wtValue)	|| (wtValue == NO_SELECTED_OPTION)){
				alert(NO_SELECTED_WORK_TYPE);
				return false;
			}

			// validate if Location was selected
			var ltValue = params[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE];
			if ((!ltValue)	|| (ltValue == NO_SELECTED_OPTION)) {
				alert(NO_SELECTED_LOCATION_TYPE);
				return false;
			}

			// validate Selected Resource(s)
			var srValue = params[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES];
			if ((!srValue) || (srValue.selectedIndex == -1)){
				alert(NO_SELECTED_RESOURCE);
				return false;
			}

			// Validate Hours of Start Time
			var hrValueStart = params[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS];
			if (isNaN(hrValueStart) || (hrValueStart === null) || (hrValueStart === "")) {
				alert(NO_SELECTED_HOURS);
				return false;
			}

			// validate Minutes of Start Time
			var miValueStart = params[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES];
			if (isNaN(miValueStart) || (miValueStart === null)) {
				alert(NO_SELECTED_MINUTES);
				return false;
			}

			// Validate Hours of End Time
			var hrValueEnd = params[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS];
			if (isNaN(hrValueEnd) || (hrValueEnd === null) || (hrValueEnd === "")) {
				alert(NO_SELECTED_HOURS);
				return false;
			}

			// validate Minutes of End Time
			var miValueEnd = params[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES];
			if (isNaN(miValueEnd) || (miValueEnd === null) ) {
				alert(NO_SELECTED_MINUTES);
				return false;
			}
		}catch(err){
			LOG.store(err,params);
			return false;
		}
		return true;
	};
	
	//TODO by DI = slice this big function into multiple smaller ones
	//Maria Ciskova 24.9.2015
	this.WorkHoursSaveData2 = function(whID) {
		/* Saving data from PopUpDiv to the SmartStore */
		try {
			var customDate = $('#'+DIV_SERVICE_ORDER_WORK_HOURS_DATE).val();
			var entryTimeReport = [];
			var entryTimeEntry = [];
			var entryWorkHours = [];
			var actDate = new Date();
			var modifyDate;
			var Param = jQuery.extend(true, {}, METHOD_PARAMETERS);
			if((ActiveAppLocation.PageName == PAGE_SERVICEORDER)&&(ActiveAppLocation.TabName == PAGE_WORKHOURS)&& (ActiveAppLocation.PopUpName = DIV_SERVICE_ORDER_WORK_HOURS_POPUP))
			{
				var work_type 		= document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE);
				var location_type 	= document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE);
				var selection_resource = document.getElementById(DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES);
				var comments 		= document.getElementById(TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS);
				var hoursStart 		= document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS);
				var minutesStart 	= document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES);
				var hoursEnd 		= document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS);
				var minutesEnd 		= document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES);
				var wtValue = '';
				var ltValue = '';
				var srValue = '';
				var commentValue = '';
				var miValueStart = 0;
				var hrValueStart = 0;
				var miValueEnd = 0;
				var hrValueEnd = 0;
				
				modifyDate = DateTimeObject.DateFormateToStringDB(actDate,'', 'date');
				actDate.setTime( actDate.getTime() + actDate.getTimezoneOffset()*60*1000 );
				modifyDateTime = DateTimeObject.FormateToStringDB(actDate,'');
				if ((hoursStart !== undefined) && (hoursStart !== null)) {
					hrValueStart = parseFloat(hoursStart.value);
				}
				if ((hoursEnd !== undefined) && (hoursEnd !== null)) {
					hrValueEnd = parseFloat(hoursEnd.value);
				}
				if ((minutesStart !== undefined) && (minutesStart !== null) &&  (minutesStart.value !== "") ) {
					miValueStart = parseFloat(minutesStart.value);
				}
				else{
					document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES).value = "00";
				}
				if ((minutesEnd !== undefined) && (minutesEnd !== null) && (minutesEnd.value !== "")) {
					miValueEnd = parseFloat(minutesEnd.value);
				}
				else{
					document.getElementById(INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES).value = "00";
				}

				if ((work_type !== undefined) && (work_type !== null)) {
					wtValue = work_type.options[work_type.selectedIndex].value;
				}

				if ((location_type !== undefined) && (location_type !== null)) {
					ltValue = location_type.options[location_type.selectedIndex].value;
				}
				
				if ((selection_resource !== undefined) && (selection_resource !== null) && (selection_resource.selectedIndex != -1)) {
					srValue = selection_resource.options[selection_resource.selectedIndex].value;
				}
					
				if ((comments !== undefined) && (comments !== null)) {
					commentValue = comments.value;
					commentValue = commentValue.replace(/[`!@#$%*|+=?;:'"<>\{\}\\\/]/gi, '');
				}
				
				
				var CheckValue = {};
				CheckValue[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_WORK_TYPE] = wtValue;
				CheckValue[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_LOCATION_TYPE] = ltValue;	
				CheckValue[DIV_SERVICE_ORDER_WORK_HOURS_POPUP_RESOURCES] = srValue;
				CheckValue[TEXTAREA_SERVICE_ORDER_WORK_HOURS_POPUP_COMMENTS] = commentValue;//todo check fields and remove special char
				CheckValue[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_MINUTES] = miValueStart;
				CheckValue[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_START_HOURS] = hrValueStart;
				CheckValue[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_MINUTES] = miValueEnd;
				CheckValue[INPUT_SERVICE_ORDER_WORK_HOURS_POPUP_END_HOURS] = hrValueEnd;
				
				//check if values are defined
				if (WorkHours.CheckBeforeSave2(CheckValue)){
					//check correct format of time
					if (WorkHours.ValidateHoursAndMinutes(hrValueStart, miValueStart, hrValueEnd, miValueEnd)){
						//------------------TIME REPORT------------------
						var time_report = jQuery.extend(true, {}, TIME_REPORT);
						//find time report ID with same Report_Date__c as entered (if exists)
						var time_reportID = null;
						for(var trId in Data.TimeReports){
							if(Data.TimeReports.hasOwnProperty(trId)){
								var tr = Data.TimeReports[trId];
								if (tr.Report_Date__c == customDate){
									time_reportID = tr.Id;
									break;
								}
							}
						}
						//create new time report
						if ((time_reportID === undefined) || (time_reportID === null)){
								time_reportID = SmartStoreManager.GeneratorID();
								time_report.Id = time_reportID;
								time_report.LastModifiedDate = modifyDateTime;
								time_report.SaveStatus = VALUE_SAVE_LOCAL;
								time_report.CreatedById = MainObject.userData.Id;
								time_report.CKSW__User__c = MainObject.userData.Id;
								time_report.Name = "TR-" + time_reportID;// At now auto-numbering
								time_report.Report_Date__c = customDate;
								time_report.Service_Order__c = Parameters.RecordId;
								time_report.attributes.type = SFDC_TIME_REPORT;
								time_report.FS_Mobility_ExternalId__c = time_reportID;
								entryTimeReport.push(time_report);
						}
						//else change saveStatus of edited time report
						else{
							time_report = Data.TimeReports[time_reportID];
							if (time_report!== null){
								time_report.SaveStatus = VALUE_SAVE_LOCAL;
								entryTimeReport.push(time_report);
							}
						}

						//------------------TIME ENTRY------------------
						//loops through all selected resources
						if((selection_resource !== undefined) && (selection_resource !== null))
						for(var i=0;i<selection_resource.length;i++){
							if(selection_resource[i].selected === true){
								var time_entryID = null;
								var resourceID = selection_resource[i].value;
								var time_entry = jQuery.extend(true, {}, TIME_ENTRY);
								//finds time entry ID with same Resource__c and Report_Date__c as entered if exists
								for(var teId in Data.TimeEntries){
									if(Data.TimeEntries.hasOwnProperty(teId)){
										var te = Data.TimeEntries[teId];
										if ((te.Resource__c == resourceID) && (te.Time_Report__c == time_reportID)){
											time_entryID = te.Id;
											break;
										}
									}
								}
								if ((time_entryID === undefined) || (time_entryID === null)){
									time_entryID = SmartStoreManager.GeneratorID();
									
									//var time_entry = jQuery.extend(true, {}, TIME_ENTRY);
									time_entry.Id = time_entryID;
									time_entry.Time_Report__c = time_reportID;
									time_entry.LastModifiedDate = modifyDateTime;
									time_entry.Name = "TE-" + time_entryID;// At now auto-numbering
									time_entry.SaveStatus = VALUE_SAVE_LOCAL;
									time_entry.CreatedById = MainObject.userData.Id;
									time_entry.Resource__c = resourceID;
									time_entry.FS_Mobility_ExternalId__c = time_entryID;
									time_entry.TimeReport_ExternalId = time_report.FS_Mobility_ExternalId__c;
									time_entry.attributes.type = SFDC_TIME_ENTRY;
									entryTimeEntry.push(time_entry);
								}
								//else change saveStatus of edited time entry
								else{
									time_entry = Data.TimeEntries[time_entryID];
									if (time_entry!== null){
										time_entry.SaveStatus = VALUE_SAVE_LOCAL;
										time_entry.Time_Report__c = time_report.Id;
										time_entry.TimeReport_ExternalId = time_report.FS_Mobility_ExternalId__c;
										entryTimeEntry.push(time_entry);
									}
								}
								
								//------------------WORK HOUR------------------
								var work_hour;
								var work_hourID = whID;
								var excludeEditedWH = "";
								//new work hour
								if((work_hourID === undefined) || (work_hourID === null) || (work_hourID === "")){
									work_hourID = SmartStoreManager.GeneratorID();
									work_hour = jQuery.extend(true, {}, WORK_HOUR);
									work_hour.Id = work_hourID;
									work_hour.Name = "WH-" + work_hourID;// At now auto-numbering
									work_hour.CreatedById = MainObject.userData.Id;
									work_hour.FS_Mobility_ExternalId__c = work_hourID;
									work_hour.attributes.type = SFDC_WORK_HOURS;
									work_hour.Approved__c = false;
								}
								else{ //edit existing work hour
									work_hour = Data.WorkedHours[work_hourID];
									excludeEditedWH = work_hourID;
								}
								work_hour.SaveStatus = VALUE_SAVE_LOCAL;
								work_hour.Time_Entry__c = time_entry.Id;	
								work_hour.TimeEntry_ExternalId = time_entry.FS_Mobility_ExternalId__c;
								work_hour.Type__c = wtValue;
								work_hour.LastModifiedDate = modifyDateTime;
								work_hour.Location__c = ltValue;
								work_hour.Comments__c = commentValue;

								//calculate reported hours
								var endTimeDecimal = hrValueEnd + DateTimeObject.TimeMinutesToDecimal(miValueEnd);
								var startTimeDecimal = hrValueStart + DateTimeObject.TimeMinutesToDecimal(miValueStart);
								var reportedHours = endTimeDecimal - startTimeDecimal;
								work_hour.Reported_Hours__c = reportedHours.toFixed(2); 
								//start and end time
								var startTime = DateTimeObject.AddZeros(hoursStart.value) + ":" + DateTimeObject.AddZeros(minutesStart.value);
								var endTime = DateTimeObject.AddZeros(hoursEnd.value) + ":" + DateTimeObject.AddZeros(minutesEnd.value);
								work_hour.Start_Time__c =  startTime;
								work_hour.End_Time__c =  endTime;
								
								//check overlaping time intervals
								var startTimeInMinutes = (hrValueStart*60 + miValueStart);
								var endTimeInMinutes = (hrValueEnd*60 + miValueEnd);
								if (WorkHours.CheckIntervalsOverlaping(customDate, resourceID, startTimeInMinutes, endTimeInMinutes, excludeEditedWH)){
									alert("Please be aware that entered time intervals are overlapping.");
								}
								
								entryWorkHours.push(work_hour);
							}
						}
						Param.Parameters.MethodRunner = "RefreshWorkHours";
						Param.RecordId = Parameters.RecordId;

						if (entryTimeReport.length > 0) {
							//save TR
							sfSmartstore().upsertSoupEntries(SOUP_TIME_REPORT, entryTimeReport,
								function(items) {
									//save TE
									if (entryTimeEntry.length > 0) {
										sfSmartstore().upsertSoupEntries(SOUP_TIME_ENTRY, entryTimeEntry,
											function(items) {
												//save WH
												if (entryWorkHours.length > 0) {
													sfSmartstore().upsertSoupEntries(SOUP_WORK_HOURS, entryWorkHours,
														function(items) {
															$("#closePopup").click();
															MethodsRunner.ProccessMethods(Param);
														},
														function(error)	{
															alert("WorkHours.WorkHoursSaveData raised error during upserting Work Hours:\n" + JSON.stringify(entryWorkHours));
														});
												}
												else{
													$("#closePopup").click();
													MethodsRunner.ProccessMethods(Param);
												}
											},
											function(error)	{
												alert("WorkHours.WorkHoursSaveData raised error during upserting Time Entries:\n" + JSON.stringify(entryTimeEntry));
											});
										}
										else{
											//save WH
											if (entryWorkHours.length > 0) {
												sfSmartstore().upsertSoupEntries(SOUP_WORK_HOURS, entryWorkHours,
													function(items) {
														$("#closePopup").click();
														MethodsRunner.ProccessMethods(Param);
													},
													function(error)	{
														alert("WorkHours.WorkHoursSaveData raised error during upserting Work Hours:\n" + JSON.stringify(entryWorkHours));
													});
											}
											else{
												$("#closePopup").click();
												MethodsRunner.ProccessMethods(Param);
											}
										}
								},
									function(error)	{
									alert("WorkHours.WorkHoursSaveData raised error during upserting Time Reports:\n" + JSON.stringify(entryTimeReport));
								}
							);
						}else{
							//save TE
							if (entryTimeEntry.length > 0) {
							sfSmartstore().upsertSoupEntries(SOUP_TIME_ENTRY, entryTimeEntry,
								function(items) {
									//save WH
									if (entryWorkHours.length > 0) {
										sfSmartstore().upsertSoupEntries(SOUP_WORK_HOURS, entryWorkHours,
											function(items) {
												$("#closePopup").click();
												MethodsRunner.ProccessMethods(Param);
											},
											function(error)	{
												alert("WorkHours.WorkHoursSaveData raised error during upserting Work Hours:\n" + JSON.stringify(entryWorkHours));
											});
									}
									else{
										$("#closePopup").click();
										MethodsRunner.ProccessMethods(Param);
									}
								},
								function(error)	{
									alert("WorkHours.WorkHoursSaveData raised error during upserting Time Entries:\n" + JSON.stringify(entryTimeEntry));
								});
							}
							else{
								//save WH
								if (entryWorkHours.length > 0) {
									sfSmartstore().upsertSoupEntries(SOUP_WORK_HOURS, entryWorkHours,
										function(items) {
											$("#closePopup").click();
											MethodsRunner.ProccessMethods(Param);
										},
										function(error)	{
											alert("WorkHours.WorkHoursSaveData raised error during upserting Work Hours:\n" + JSON.stringify(entryWorkHours));
										});
								}
								else{
									$("#closePopup").click();
									MethodsRunner.ProccessMethods(Param);
								}
							}
						}
					}
				}

			} // end
		} catch (err) {
			// MainObject.MessagesPage.messageTemplate(DIV_INDEX_PAGE_STATUS,MSG_ERROR,Parameters.Status+"
			// downloading: "+sText,ProcessBar);
			LOG.store(err,whID);
		}
	};

	/* Informs user when he entered time interval <Start,End> that overlaps already existing Work Hour record. But allows him to save */
	this.CheckIntervalsOverlaping = function(date, resId, startTime, endTime, whId) {
		try{
			var workHours = null;
			//get all work hours for specified date and resource
			var timeReport = DataMap[date];
			if((timeReport !== undefined) && (timeReport !== null)){
				var timeEntry = timeReport.Time_Entry_Items[resId];
				if((timeEntry !== undefined) && (timeEntry !== null)){
					workHours = timeEntry.Work_Hour_Items;	
				}		
			}
			//check intervals 
			if((workHours !== undefined) &&(workHours !== null) && (workHours.length > 0 )){
				for(var i=0,j=workHours.length;i<j;i++){
					if((whId !== undefined) && (whId !== null) && (whId !== "") && (workHours[i].Id == whId))
						continue;
					var hhmmStart = DateTimeObject.GetHoursAndMinutesFromHHMMTime(workHours[i].Start_Time__c);
					var hhmmEnd = DateTimeObject.GetHoursAndMinutesFromHHMMTime(workHours[i].End_Time__c);
					if ((hhmmStart === undefined) || (hhmmStart === null) || (hhmmEnd === undefined) || (hhmmEnd === null))
						continue;
					if ((hhmmStart[0] ==="") || (hhmmStart[1] ==="") || (hhmmEnd[0] ==="") || (hhmmEnd[1] ===""))
						continue;
					else{
						//convert start and end time to minutes
						var startTimeTemp = parseInt(hhmmStart[0])*60 + parseInt(hhmmStart[1]);
						var endTimeTemp = parseInt(hhmmEnd[0]*60) + parseInt(hhmmEnd[1]);
						//if equation results in negative number the intervals are overlaping
						if (((startTimeTemp - endTime) * (endTimeTemp - startTime)) < 0)
							return true;
					}
				}
			}
		}catch(err){
			LOG.store(err,{"date":date,"resId":resId,"startTime":startTime,"endTime":endTime,"whId":whId});
		}
		return false;
	};

	// 28.9. Denis Ivancik started on Customer Approval section	
	// Pseudo Code:
		// get data from smartStore and store them to global variable
			// Service Orders related to Installation
			// Customer Name and Email, General Remarks
		// redraw pop-up -> drawApprovalInfoPage
			// $('#work-hours-approval-popup-container')
				// <div class="input-section"></div>
					// Service Orders - MultiPicklist
					// Customer Name and Email - input text
					// General Remarks - input long text area
					// Cancel Button - click close button
					// Summary button - save to SS and show summary pop-up
				// <div class="clear-both"></div>
	this.customerApprovalPopup = function() {
		try{
			//use list of obtained IDs of Service Orders, to obtain more data
			vars.SOIdList = "";
			for(var key in Data.ServiceOrdersIDs){
				if(Data.ServiceOrdersIDs.hasOwnProperty(key)){
					if(vars.SOIdList !==""){
						vars.SOIdList += ",";
					}
					vars.SOIdList += "'"+key+"'";
				}
			}
			vars.replaceParams = { VariableType : "String", ReplaceValue : ":idList", VariableValue : vars.SOIdList};
			vars.SQL_PARAMS = SQLTable["SQLITE_CUSTOMER_APPROVAL"];
			vars.QUERY = vars.SQL_PARAMS.SQL + ReplaceSQLParameters(vars.SQL_PARAMS.WHERE, vars.replaceParams) + vars.SQL_PARAMS.ORDERBY;
			delete vars.SOIdList;
			delete vars.replaceParams;
			vars.querySpec = sfSmartstore().buildSmartQuerySpec(vars.QUERY, vars.SQL_PARAMS.LIMIT);
			sfSmartstore().runSmartQuery(vars.querySpec,function(cursor) {
				delete vars.QUERY;
				delete vars.querySpec;
				delete vars.SQL_PARAMS;
				WorkHours.drawApprovalInfoPage(cursor.currentPageOrderedEntries[0]);
			},function(error){
				LOG.store(error,vars.querySpec);
			});
		}catch(err){
			LOG.store(err);
		}
		return false;
	};

	this.drawApprovalInfoPage = function(response){
		try{
			document.getElementById("work-hours-approval-popup").style.display = "none";
			$("#work-hours-approval-popup").popup("close");
			var container = $('#work-hours-approval-popup-container');
			container.html('                                                                                            ');
			//container.addClass("work-hours-approval-containeredit sigPad");
			var inputSection = $('<div class="input-section"></div>');

			// Title of Popup
			inputSection.append('<p class="no-margin no-padding"><h2 style="font-weight:normal">Working hours approval</h2></p>');

			// Service Orders - MultiPicklist
			var serviceOrders = $(
				'<div class="">' +
					'<p class="large small-padding small-margin">Service Order:</p>' +
				'</div>');
			if(vars.selectedOrders === undefined){
				var serviceOrdersPickList = $('<div>'+
					//'<select id="'+DIV_SERVICE_ORDER_APPROVAL_POPUP_SO_PICKLIST+
					//'" name="select-native-1" multiple class="sharp-corners" ></select>');
					'</div>');
				for(var key in Data.ServiceOrdersIDs){
					if(Data.ServiceOrdersIDs.hasOwnProperty(key)){
						var optionItem = '<span>';//'<option ';
						if(key == RecordId){
							//optionItem += 'selected="selected" ';
						}
						optionItem += /*'value="'+key+'">'+*/Data.ServiceOrdersIDs[key]/*+'</option>'*/+'</span>';
						var optionElement = $(optionItem);
						serviceOrdersPickList.append(optionElement);
					}
				}
				serviceOrders.append(serviceOrdersPickList);
			}else{
				serviceOrders.append(vars.selectedOrders);
			}

			inputSection.append(serviceOrders);

			// Customer Name - input text
			var customerName = $(
				'<div class="">' +
					'<br/><label for="work-hours-approval-name">Customer Name, Company</label>' +
				'</div>');
			var iName = response[2].WRTS_Contact_Person_Name__c; 
			if(iName === undefined || iName === null || iName == "null"){
				iName = "";
			}
			var customerNameInput = $('<input type="text" maxlength="80" id="'+DIV_SERVICE_ORDER_APPROVAL_POPUP_NAME_INPUT
					+'" id="work-hours-approval-name" name="customer_name" value="'+iName+'" class="sharp-corners" />');
			customerName.append(customerNameInput);

			inputSection.append(customerName);

			// Customer Email - input text
			var iEmail = response[2].WRTS_Contact_Person_Email__c; 
			if(iEmail === undefined || iEmail === null || iEmail == "null"){
				iEmail = "";
			}
			var customerEmail = $(
				'<div class="">' +
					'<br/><label for="work-hours-approval-email">Customer Email</label>' +
				'</div>');
			var customerEmailInput = $('<input type="email" maxlength="256" id="'+DIV_SERVICE_ORDER_APPROVAL_POPUP_EMAIL_INPUT
				+'" id="work-hours-approval-email" name="customer_email" value="'+iEmail+'" class="sharp-corners" />');
			customerEmail.append(customerEmailInput);

			inputSection.append(customerEmail);

					// General Remarks - input long text area
			var iRemarks = response[2].General_Remarks__c;
			if(iRemarks === undefined || iRemarks === null || iRemarks == "null"){
				iRemarks = "";
			}
			var generalRemarks = $(
				'<div class="">' +
					'<br/><label for="work-hours-approval-sign">General Remarks</label>' +
				'</div>');
			var generalRemarksInput = $('<textarea id="'+DIV_SERVICE_ORDER_APPROVAL_POPUP_REMARKS_INPUT+'"'+
				' class="work-hours-approval-sign-textarea sharp-corners" name="work-hours-approval-sign" rows="5" cols="1" >'+iRemarks+'</textarea>');
			generalRemarks.append(generalRemarksInput);

			inputSection.append(generalRemarks);

			var buttons = $('<div class="float-right"></div>');
					// Cancel Button - click close button
			var cancelButton = $('<button class="wartsila-btn orange ui-btn ui-btn-inline" onclick="WorkHours.closeApprovalPopup();">Cancel</button>');
			buttons.append(cancelButton);
					// Summary button - save2SS and show summary pop-up
			var summarytButton = $('<button id="btnWorkHoursSubmit" class="wartsila-btn orange ui-btn ui-btn-inline" onclick="WorkHours.goToApprovalSummary();">Summary</button>');
			buttons.append(summarytButton);

			inputSection.append(buttons);

			container.append(inputSection);
				// <div class="clear-both"></div>
			var clearSection = $('<div class="clear-both"></div>');
			container.append(clearSection);
			container.trigger("create");
			setTimeout(function(){
				document.getElementById("work-hours-approval-popup").style.display = "block";
				$("#work-hours-approval-popup").popup("open");
			}, 50);
		}catch(err){
			LOG.store(err,response);
		}
	};

	// Pseudo Code
		// Save input fields into Memory
			// Store  Customer info and General Remarks to global variable
			// Validate Email
			// Upsert Service Order with Customer info and General Remarks
		// -> Display Summary Page -> drawApprovalSummaryPage
	this.goToApprovalSummary = function(){
		try{
			vars.customerName = document.getElementById(DIV_SERVICE_ORDER_APPROVAL_POPUP_NAME_INPUT).value;
			vars.customerEmail = document.getElementById(DIV_SERVICE_ORDER_APPROVAL_POPUP_EMAIL_INPUT).value;
			vars.geteralRemarks = document.getElementById(DIV_SERVICE_ORDER_APPROVAL_POPUP_REMARKS_INPUT).value;
			//vars.selectedOrders = document.getElementById(DIV_SERVICE_ORDER_APPROVAL_POPUP_SO_PICKLIST);
			if(vars.customerName === undefined || vars.customerName === null || vars.customerName == "null"){
				vars.customerName = "";
			}
			if(vars.customerEmail === undefined || vars.customerEmail === null || vars.customerEmail == "null"){
				vars.customerEmail = "";
			}else{
				// comma separated emails, removing extra spaces, comas and semicolons
				vars.customerEmail = vars.customerEmail.replace(/[ ;,]+/g,',').replace(/^,|,$/g,'');
			}
			if(vars.geteralRemarks === undefined || vars.geteralRemarks === null || vars.geteralRemarks == "null"){
				vars.geteralRemarks = "";
			}
			if(WorkHours.noneServiceOrderWasSelected()){
				alert("You should select at least one Service Order.");
				return;
			}
			if(!WorkHours.validCustomerEmail()){
				alert("Customer Email needs to be filled correctly, use following format:\ncustomer@host.domain\nYou can enter additional emails as CC, separated by comma.");
				return;
			}
			vars.selectedDataMap = WorkHours.filterDataMapBySelectedOrders();

			var QUERY = " SELECT {"+SOUP_WORK_ORDER+":_soup} FROM {"+SOUP_WORK_ORDER+"} WHERE {"+SOUP_WORK_ORDER+":Id}='"+RecordId+"' ";
			var querySpec = sfSmartstore().buildSmartQuerySpec(QUERY, 1);
			sfSmartstore().runSmartQuery(querySpec,
				function(cursor) {
					var recordToUpdate = cursor.currentPageOrderedEntries[0];
					vars.recordToUpdate = recordToUpdate[0];
					vars.FSM_SignatureJSON__c = vars.recordToUpdate.FSM_SignatureJSON__c;
					var needToUpsert = false;
					if(vars.recordToUpdate.WRTS_Contact_Person_Name__c != vars.customerName){
						vars.recordToUpdate.WRTS_Contact_Person_Name__c = vars.customerName;
						needToUpsert = true;
					}
					if(vars.recordToUpdate.WRTS_Contact_Person_Email__c != vars.customerEmail){
						vars.recordToUpdate.WRTS_Contact_Person_Email__c = vars.customerEmail;
						needToUpsert = true;
					}
					if(vars.recordToUpdate.General_Remarks__c != vars.geteralRemarks){
						vars.recordToUpdate.General_Remarks__c = vars.geteralRemarks;
						needToUpsert = true;
					}
					if(needToUpsert){
						var toUpdateArray = [];
						toUpdateArray.push(vars.recordToUpdate);
						sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_WORK_ORDER, toUpdateArray,"Id",
							function(items){
								WorkHours.drawApprovalSummaryPage();
							},
							function(err){
								alert("failed to update data\n"+err.message);
								WorkHours.drawApprovalSummaryPage();
							}
						);
					}else{
						WorkHours.drawApprovalSummaryPage();
					}
				},function(error){
					LOG.store(error);
				});
		}catch(err){
			LOG.store(err);
		}
	};

	this.validCustomerEmail = function(){
		var result = true;
		try{
			if(vars.customerEmail === ""){
				alert("Remember that Time Sheet (PDF) will not be emailed to customer when 'Customer Email' is empty.");
				return result;
			}
			if(vars.customerEmail !== undefined || vars.customerEmail !== null || vars.customerEmail != "null" || vars.customerEmail !== ""){
				var emailArray = vars.customerEmail.split(',');
				var emailPattern = new RegExp("^([a-zA-Z0-9_.-])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+$");
				for(var key in emailArray){
					if(emailArray.hasOwnProperty(key)){
						result = emailPattern.test(emailArray[key]);
						if(!result){
							break;
						}
					}
				}
			}
		}catch(err){
			result = true;
			LOG.store(err);
		}
		return result;
	};

	this.noneServiceOrderWasSelected = function(){
		var result = true;
		try{
			//var optionList = vars.selectedOrders.options;
			//for(var i = 0, j = optionList.length; i<j;i++){
				//if(optionList[i].selected){
					result = false;
					//break;
				//}
			//}
		}catch(err){
			result = true;
			LOG.store(err);
		}
		return result;
	};

	this.filterDataMapBySelectedOrders = function(){
		var result = jQuery.extend(true, {}, DataMap);
		try{
			var keyList = [];
			for(var key in Data.ServiceOrdersIDs){
				if(Data.ServiceOrdersIDs.hasOwnProperty(key)){
					keyList.push(key);
				}
			}
			vars.selectedIds = {};
			vars.selectedIds[RecordId] = true;
			/*
			var optionList = vars.selectedOrders.options;
			for(var a = 0, b = optionList.length; a<b;a++){
				if(optionList[a].selected){
					vars.selectedIds[keyList[a]] = true;
				}
			}
			*/
			// Data Structure as a help to guy who will debug after me
			// vars.selectedIds { ServiceOrderId : true }
			// Data.TimeReports { Id : {_soup of Time Report Table} }
			// DataMap {
					// reportedDate : {Report_Date, Reported_Hours_Total,Time_Entry_Items{} }
						// Time_Entry_Items :=	resourceName : {Resource_Name, Reported_Hours_Sum, Work_Hour_Items[]}
							// Work_Hour_Items := [ WORK_HOUR_ITEM ]
			for(var reportedDate in result){	// level 1
				if(result.hasOwnProperty(reportedDate)){
					for(var resourceName in result[reportedDate].Time_Entry_Items){	// level 3
						if(result[reportedDate].Time_Entry_Items.hasOwnProperty(resourceName)){
							for(var i=0,j = result[reportedDate].Time_Entry_Items[resourceName].Work_Hour_Items.length;i<j;i++){ // level 5
								if(vars.selectedIds[Data.TimeReports[result[reportedDate].Time_Entry_Items[resourceName].Work_Hour_Items[i].Time_Report_Id].Service_Order__c] === true){// level 7
									//keep this one in summary page
								}
								else{
									// delete Work_Hour_Items[i]
									result[reportedDate].Time_Entry_Items[resourceName].Work_Hour_Items.splice(i, 1);
									i--;
									j--;
								}
							}
							if(result[reportedDate].Time_Entry_Items[resourceName].Work_Hour_Items.length < 1){
								// delete Time Entry that has 0 Work Hours
								delete result[reportedDate].Time_Entry_Items[resourceName];
							}
						}
					}
					if(jQuery.isEmptyObject(result[reportedDate].Time_Entry_Items)){
						// delete Time Report that has 0 Time Entries
						delete result[reportedDate];
					}
				}
			}
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	// Display Summary Page
	this.drawApprovalSummaryPage = function(){
		try{
			document.getElementById("work-hours-approval-popup").style.display = "none";
			$("#work-hours-approval-popup").popup("close");
			// Container of whole Customer Approval Pop-up
			var container = $('#work-hours-approval-popup-container');
			container.html('');
			
			// Div into which we draw all elements
			var summarySection = $('<div class="input-section"></div>');

			// Useful HTML element that is used for CSS and design purposes
			var clearSection = $('<div class="clear-both"></div>');

			// Title of Pop-up
			summarySection.append('<h2 style="font-weight:normal;display:inline;">TIME SHEET preview</h2>');

			// List of selected Service Orders
			summarySection.append(WorkHours.ApprvalSelectedOrders());

			//The following two commands cause the workhour popup bug
			// Detailed Table of Time Registrations, grouped by Date and Name
			summarySection.append(WorkHours.ApprovalReports());

			// Total Hours section
			summarySection.append(WorkHours.ApprovalTotalHours());

			// Customer Name and Email section
			summarySection.append(WorkHours.ApprovalCustomer());

			// General Remarks section
			summarySection.append(WorkHours.ApprovalRemarks());

			// Default Buttons - BACK and DIGITAL SIGNATURE
			summarySection.append(WorkHours.ApprovalButtons());

			// Signature Section
			summarySection.append(WorkHours.ApprovalSignature());

			container.append(summarySection);
			container.append(clearSection);

			container.trigger("create");

			// Add functionality to newly created elements
			WorkHours.EnableApprovalButtons();

			//HACK: The following lines are to close the popup, and reopen it after 40ms
			//To prevent the weird resizing bug. The slight flicker is better than badly formatted
			//Popup... Still... quite ugly... -KH
			setTimeout(function(){
				document.getElementById("work-hours-approval-popup").style.display = "block";
				$("#work-hours-approval-popup").popup("open");
			}, 80);
		}catch(err){
			LOG.store(err);
		}
	};

	/* Draws a list of previously-chosen Service Orders to approve */
	this.ApprvalSelectedOrders = function(){
		var result = $('<p></p>');
		try{
			//var keyList = [];
			for(var key in Data.ServiceOrdersIDs){
				if(Data.ServiceOrdersIDs.hasOwnProperty(key)){
					//keyList.push(key);
					result.append('<span>'+Data.ServiceOrdersIDs[key]+'</span><br/>');
				}
			}
			/*var optionList = vars.selectedOrders.options;
			for(var i = 0, j = optionList.length; i<j;i++){
				if(optionList[i].selected){
					var serviceOrder = $('<span>'+Data.ServiceOrdersIDs[keyList[i]]+'</span><br/>');
					result.append(serviceOrder);
				}
			}*/
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws group of Time Reports sorted by Date */
	this.ApprovalReports = function(){
		var result = $('<div></div>');
		vars.TotalHours = 0;
		try{
			var keyList = [];
			for(var key in vars.selectedDataMap){
				if(vars.selectedDataMap.hasOwnProperty(key)){
					keyList.push(key);
				}
			}
			keyList.sort();
			for(var i=0,j=keyList.length;i<j;i++){
				var timeReport = $('<h4 style="font-weight:normal"></h4>');
				var reportedDate = $('<h2 style="display:inline;font-weight:normal">'+DateTimeObject.toEuropeanFormat(keyList[i])+'</h2>');
				vars.TotalHours += vars.selectedDataMap[keyList[i]].Reported_Hours_Total;
				timeReport.append(reportedDate);
				timeReport.append(WorkHours.ApprovalEntries(keyList[i]));
				result.append(timeReport);
			}
			vars.TotalHours = parseFloat(vars.TotalHours.toFixed(2));			
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws group of Time Entries sorted by Name */
	this.ApprovalEntries = function(index){
		var result = $('<div class="wh-summary-block"></div>');
		try{
			var keyList = [];
			var keyMap = {};
			var TEmap = vars.selectedDataMap[index].Time_Entry_Items;
			for(var key in TEmap){
				if(TEmap.hasOwnProperty(key)){
					keyMap[TEmap[key].Resource_Name] = key;
					keyList.push(TEmap[key].Resource_Name);
				}
			}
			keyList.sort();
			for(var i=0,j=keyList.length;i<j;i++){
				result.append(WorkHours.ApprovalHours(keyList[i],TEmap[keyMap[keyList[i]]]));
			}
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	
	/* Draws a row with a Name and info of Worked hours */
	this.ApprovalHours = function(Name, workedHours){
		var result = $('<div></div>');
				
		var addComments = false;
		for(var i=0,j=workedHours.Work_Hour_Items.length;i<j;i++){ 
			if(workedHours.Work_Hour_Items[i].Comments__c.length > 0){
				addComments=true;
				break;
			}
		}
		
		
		// iterate over WorkHourItems, sort them, generate html lines
		for(var i=0,j=workedHours.Work_Hour_Items.length;i<j;i++){ 
			var WH = workedHours.Work_Hour_Items[i];
					
			result.append('<div class="wh-summary-left large">' + Name + printWorkType(WH.Type__c) + DOTS + '</div>');
			
			if(addComments){
				var rightPanel = $('<div class="wh-summary-right large"></div>');
				rightPanel.append('<span class="wh-summary-center large" >' + WH.Start_Time__c + '-' + WH.End_Time__c +'</span>');				
				rightPanel.append('<span class="wh-comments">' + WH.Comments__c + '</span>');
				result.append(rightPanel);
			}
			else{
				result.append('<div class="wh-summary-right large">' + WH.Start_Time__c + '-' + WH.End_Time__c +'</div>');
			}
			result.append('<br/>');
		}
		return result;
	};
	
	function printWorkType(type){
		var result = "";
		try{
			switch(type.toLowerCase()){
				case "normal":
				case "overtime a":
				case "overtime b":
					result = '(Work)';
					break;
				case "waiting":
				case "wait":
					result = '(Wait)';
					break;
				case "travel":
					result = '(Travel)';
					break;
				default:
					break;
			}
			if(result){
				result = '<span class="work-hour-small-type">'+result+'</span>';
			}
		}catch(Pokemon){
			LOG.store(Pokemon,{"Where":"printWorkType","type":type});
		}
		return result;
	}

	/* Draws Total amount of hours */
	this.ApprovalTotalHours = function(){
		var result = $('<h4 style="width:100%;"></h4>');
		try{
			var dotDiv = $('<div class="dotFiller" style="height: 18px;"></div>');
			result.append('<span style="font-size:18px;" class="work-type no-margin no-padding">Total hours' + DOTS + '</span>');
			result.append('<span style="font-size:18px;" class="hours no-margin no-padding">'+ DateTimeObject.TimeFormat(vars.TotalHours) + DOTS + '</span>');
			result.append('<div class="clear-both"></div>');
			result.append(dotDiv);
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws info about Customer - Name and Email */
	this.ApprovalCustomer = function(){
		var result = $('<h4 style="font-weight:normal"></h4>');
		try{
			result.append('<span style="font-size:200%;">Customer</span><br/>');
			result.append('<span style="font-size: 16px;">'+vars.customerName+'</span>');
			if(vars.customerEmail){
				result.append('<br/><span style="font-size: 16px;">'+vars.customerEmail.replace(/[,]+/g,' ')+'</span>');
			}
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws text area with General Remarks */
	this.ApprovalRemarks = function(){
		var result = $('<h4 style="font-weight:normal"></h4>');
		try{
			result.append('<span style="font-size:200%;">General remarks</span><br/>');
			result.append('<pre style="font-size: 16px;">'+vars.geteralRemarks+' </pre>');
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws Back and Digital Signature buttons centered on middle */
	this.ApprovalButtons = function(){
		var result = $('<div class="centered"></div>');
		try{
			result.append('<button class="wartsila-btn orange ui-btn ui-btn-inline" onclick="WorkHours.customerApprovalPopup();">BACK</button>');
			result.append('<button id="btnDigitalSignature" class="wartsila-btn orange ui-btn ui-btn-inline" '+
							'onclick="WorkHours.showSignatureSection();">DIGITAL SIGNATURE</button>');
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Draws area for Signature and related buttons */
	this.ApprovalSignature = function(){
		var result = $('<div id="signature-section" style="display:none;"></div>');
		try{
			// Signature Box that will contain Canvas for drawing a signature
			var sigWidth = window.innerWidth * 0.8;
			result.append('<div id="sigBoxWrapper"><div id="sigBox" style="width:'+sigWidth+'px;"></div></div>');

			// Functionality of these buttons will be added after container.trigger("create")
			// because Signature plugin works only on created HTML elements 

			// SIGN button, it will store Signature to device, lock canvas, enable submit, disable this button,
			result.append('<button class="wartsila-btn orange ui-btn ui-btn-inline" id="btnSign" >SIGN</button>');

			// CLEAR button, it will clear canvas, enable SIGN, disable SUBMIT
			result.append('<button class="wartsila-btn orange ui-btn ui-btn-inline" id="btnSignClear" >CLEAR</button>');

			// Section with buttons related to whole Customer Approval - CANCEL and SUBMIT
			var submitSection = $('<p class="float-right"></p>'); //<div class="float-right"></div>

			// CANCEL button, it will hide Signature section, reset remaining buttons/canvas to origin
			submitSection.append('<button class="wartsila-btn orange ui-btn ui-btn-inline" id="btnCancel" >CANCEL</button>');

			// SUBMIT button, you want to sent Data to Salesforce, close popup, update Time Registrations (to hide them)
			submitSection.append('<button id="btnWorkHoursSubmit" class="wartsila-btn ui-btn ui-btn-inline ui-disabled" onclick="WorkHours.submitApproval();">SUBMIT</button>');

			result.append(submitSection);
		}
		catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Adds functionality to newly drawn buttons on Approval Pop-up */
	this.EnableApprovalButtons = function(){
		try{
			// if (signature exists) -> SIGN off, SUBMIT on, canvas filled and disabled
			if(vars.FSM_SignatureJSON__c !== undefined && vars.FSM_SignatureJSON__c !== null && vars.FSM_SignatureJSON__c !== ""){
				$('#sigBox').signature({disabled: true});
				$('#sigBox').signature('draw', vars.FSM_SignatureJSON__c);
				WorkHours.ButtonOff("#btnSign");
				WorkHours.ButtonOn("#btnWorkHoursSubmit");
			}else{
				// else -> canvas is empty and enabled, SIGN on, SUBMIT off
				$('#sigBox').signature();
				WorkHours.ButtonOn("#btnSign");
				WorkHours.ButtonOff("#btnWorkHoursSubmit");
			}
			// SIGN button, store Signature, turn off itself, SUBMIT on
			$('#btnSign').click(function(){
				vars.FSM_SignatureJSON__c = $('#sigBox').signature('toJSON');
				WorkHours.ButtonOn('#btnWorkHoursSubmit');
				WorkHours.ButtonOff("#btnSign");

				$('#sigBox').signature({disabled: true});
				$('#sigBox').signature('draw', vars.FSM_SignatureJSON__c);
				var sigElements = $('#sigBox').children();

				//update Service Order with new Signature
				vars.recordToUpdate.FSM_SignatureJSON__c = vars.FSM_SignatureJSON__c;
				vars.recordToUpdate.FSM_Signature__c = sigElements[0].toDataURL();
				var toUpdateArray = [];
				toUpdateArray.push(vars.recordToUpdate);
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_WORK_ORDER, toUpdateArray,"Id",
					function(items){logToConsole()("Signature was stored to Service Order");},
					function(error){
						LOG.store(error);
					}
				);
			});

			// CLEAR button
			$("#btnSignClear").click(function(){
				delete vars.FSM_SignatureJSON__c;
				WorkHours.resetApprovalBox();
				$('#sigBox').signature();
				WorkHours.ButtonOn("#btnSign");
				WorkHours.ButtonOff("#btnWorkHoursSubmit");
			});

			// CANCEL button
			$("#btnCancel").click(function(){
				WorkHours.hideSignatureSection();
				WorkHours.closeApprovalPopup();
			});
		}catch(err){
			LOG.store(err);
		}
	};

	/* Enables button */
	this.ButtonOn = function(id){
		try{
			var element = $(id);
			element.removeClass('ui-disabled');
			element.addClass('orange');
			element.disabled = false;
		}catch(err){
			LOG.store(err);
		}
	};

	/* Disables button */
	this.ButtonOff = function(id){
		try{
			var element = $(id);
			element.removeClass('orange');
			element.addClass('ui-disabled');
			element.disabled = true;
		}catch(err){
			LOG.store(err);
		}
	};

	this.showSignatureSection = function(){
		try{
			$("#signature-section").show();
			WorkHours.ButtonOff("#btnDigitalSignature");
		}catch(err){
			LOG.store(err);
		}
	};

	this.hideSignatureSection = function(){
		try{
			$("#signature-section").hide();
			WorkHours.ButtonOn("#btnDigitalSignature");
		}catch(err){
			LOG.store(err);
		}
	};

	this.closeApprovalPopup = function(){
		try{
			$("#work-hours-approval-popup").popup("close");
		}catch(err){
			LOG.store(err);
		}
	};

	/* Clears drawing box for Signature, removes the previous one */
	this.resetApprovalBox = function(){
		try{
			var resetDiv = $("#sigBoxWrapper");
			resetDiv.html('');
			var sigWidth = window.innerWidth * 0.8;
			resetDiv.append('<div id="sigBox" style="width:'+sigWidth+'px;"></div>');
			resetDiv.trigger("create");
		}catch(err){
			LOG.store(err);
		}
	};

	/* Denis - this will mark data as Approved and update SmartStore */
	this.submitApproval = function(){
		try{
			var actDate = new Date();
			actDate.setTime( actDate.getTime() + actDate.getTimezoneOffset()*60*1000 );
			var modifyDateTime = DateTimeObject.FormateToStringDB(actDate,'');
			if(WorkHours.validApprovalData()){
				setTimeout(function(){
						$.mobile.loading('show');
					}, 1);
				// TODO: Update WH, TE, TR, SO
				vars.WHs2Update = [];
				vars.TEs2Update = [];
				vars.TRs2Update = [];
				var WHcacheMap = {};
				var TEcacheMap = {};
				var TRcacheMap = {};
				vars.ApprovedWHs = "";
				// find variable, map, where is only selected stuff -> vars.selectedDataMap
				// iterate over it, find records from Data variable, 
				for(var key in vars.selectedDataMap){
					if(vars.selectedDataMap.hasOwnProperty(key)){
						var TEmap = vars.selectedDataMap[key].Time_Entry_Items;
						for(var TEkey in TEmap){
							if(TEmap.hasOwnProperty(TEkey)){
								var WHlist = TEmap[TEkey].Work_Hour_Items;
								for(var i = 0, j = WHlist.length; i<j; i++){
									WHcacheMap[WHlist[i].Id] = Data.WorkedHours[WHlist[i].Id];
									TEcacheMap[WHlist[i].Time_Entry_Id] = Data.TimeEntries[WHlist[i].Time_Entry_Id];
									TRcacheMap[WHlist[i].Time_Report_Id] = Data.TimeReports[WHlist[i].Time_Report_Id];
									// now update their parent external Id, DI Fix of Failed SyncMobileData after Approval 20th October
									WHcacheMap[WHlist[i].Id].TimeEntry_ExternalId = TEcacheMap[WHlist[i].Time_Entry_Id].FS_Mobility_ExternalId__c;
									TEcacheMap[WHlist[i].Time_Entry_Id].TimeReport_ExternalId = TRcacheMap[WHlist[i].Time_Report_Id].FS_Mobility_ExternalId__c;
								}
								//WHlist contains Id , Time_Entry_Id, Time_Report_Id
							}
						}
					}
				}
				vars.approvalId = SmartStoreManager.GeneratorID();
				for(var WHkey in WHcacheMap){
					if(WHcacheMap.hasOwnProperty(WHkey)){
						var item = WHcacheMap[WHkey];
						item.Approved__c = true;
						item.LastModifiedDate = modifyDateTime;
						item.SaveStatus = VALUE_SAVE_LOCAL;
						item.FSM_ApprovalId__c = vars.approvalId;
						vars.WHs2Update.push(item);
						if(vars.ApprovedWHs !== undefined && vars.ApprovedWHs !== null && vars.ApprovedWHs !== ""){
							vars.ApprovedWHs += ' ';
						}
						vars.ApprovedWHs += ''+WHkey+'';
					}
				}
				for(var TEKey in TEcacheMap){
					if(TEcacheMap.hasOwnProperty(TEKey)){
						var TEitem = TEcacheMap[TEKey];
						TEitem.LastModifiedDate = modifyDateTime;
						TEitem.SaveStatus = VALUE_SAVE_LOCAL;
						vars.TEs2Update.push(TEitem);
					}
				}
				for(var TRkey in TRcacheMap){
					if(TRcacheMap.hasOwnProperty(TRkey)){
						var TRitem = TRcacheMap[TRkey];
						TRitem.LastModifiedDate = modifyDateTime;
						TRitem.SaveStatus = VALUE_SAVE_LOCAL;
						vars.TRs2Update.push(TRitem);
					}
				}
				WorkHours.ApproveWorkHoursToSmartStore();
			}
		}catch(err){
			LOG.store(err);
		}
		
	};

	/* Validates if Submit pop-up contains all required information */
	this.validApprovalData = function(){
		var result = true;
		var customerError = false;
		var errorMessage ="";
		try{
			if(vars.recordToUpdate.WRTS_Contact_Person_Name__c === undefined 
				|| vars.recordToUpdate.WRTS_Contact_Person_Name__c === null 
				|| vars.recordToUpdate.WRTS_Contact_Person_Name__c === ""){
				errorMessage += "Customer Name should not be empty.\n";
				customerError = true;
				result = false;
			}
			if(vars.recordToUpdate.WRTS_Contact_Person_Email__c === undefined 
				|| vars.recordToUpdate.WRTS_Contact_Person_Email__c === null){
				errorMessage += "Customer Email should not be empty.\n";
				customerError = true;
				result = false;
			}
			if(customerError){
				errorMessage += "Please, click 'BACK' button to correct Customer details.\n\n";
			}
			if(vars.FSM_SignatureJSON__c === undefined || vars.FSM_SignatureJSON__c === null || vars.FSM_SignatureJSON__c === ""){
				errorMessage += "Please, draw your signature into box and then click 'SIGN' button. Customer Approval process can't be completed without signature.\n\n";
				result = false;
			}else{
				var emptySignatureCheck = JSON.parse(vars.FSM_SignatureJSON__c).lines;
				if(emptySignatureCheck === undefined || emptySignatureCheck === null || emptySignatureCheck === ""){
					errorMessage += "Signature can't be empty. Please, click 'CLEAR' button and draw signature again.\n\n";
					result = false;
				}
			}
			if(vars.TotalHours === undefined || vars.TotalHours === null || vars.TotalHours === "" || vars.TotalHours === 0 || vars.TotalHours == "0"){
				errorMessage += "No Work Hours to approve and submit. Please, be sure that selected Service Orders contain Work Hour entries.";
				result = false;
			}
			if(!result){
				alert(errorMessage);
			}
		}catch(err){
			LOG.store(err);
		}
		return result;
	};

	/* Updates Approved Work Hours to SmartStore */
	this.ApproveWorkHoursToSmartStore = function(){
		try{
			if(vars !== undefined && vars.WHs2Update !== undefined && vars.WHs2Update !== null && vars.WHs2Update.length > 0){
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_WORK_HOURS, vars.WHs2Update,"Id",
						function(items){
							WorkHours.ApproveTimeEntriesToSmartStore();
						},
						function(error){
							LOG.store(error,vars.WHs2Update);
							WorkHours.ApproveTimeEntriesToSmartStore();
						}
					);
			}else{
				WorkHours.ApproveTimeEntriesToSmartStore();
			}
		}catch(err){
			LOG.store(err);
			WorkHours.ApproveTimeEntriesToSmartStore();
		}
	};

	/* Updates Approved Work Hours to SmartStore */
	this.ApproveTimeEntriesToSmartStore = function(){
		try{
			if(vars !== undefined && vars.TEs2Update !== undefined && vars.TEs2Update !== null && vars.TEs2Update.length > 0){
				delete vars.WHs2Update;
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_TIME_ENTRY, vars.TEs2Update,"Id",
						function(items){
							WorkHours.ApproveTimeReportsToSmartStore();
						},
						function(error){
							LOG.store(error,vars.TEs2Update);
							WorkHours.ApproveTimeReportsToSmartStore();
						}
					);
			}else{
				WorkHours.ApproveTimeReportsToSmartStore();
			}
		}catch(err){
			LOG.store(err);
			WorkHours.ApproveTimeReportsToSmartStore();
		}
	};

	/* Updates Approved Work Hours to SmartStore */
	this.ApproveTimeReportsToSmartStore = function(){
		try{
			if(vars !== undefined && vars.TRs2Update !== undefined && vars.TRs2Update !== null && vars.TRs2Update.length > 0){
				sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_TIME_REPORT, vars.TRs2Update,"Id",
						function(items){
							WorkHours.AddApprovalToSmartStore();
						},
						function(error){
							LOG.store(error,vars.TRs2Update);
							WorkHours.AddApprovalToSmartStore();
						}
					);
			}else{
				WorkHours.AddApprovalToSmartStore();
			}
		}catch(err){
			LOG.store(err);
			WorkHours.AddApprovalToSmartStore();
		}
	};

	/* Updates Service Order to SmartStore and Marks it as Approved */
	this.AddApprovalToSmartStore = function(){
		try{
			var actDate = new Date();
			actDate.setTime( actDate.getTime() + actDate.getTimezoneOffset()*60*1000 );
			var modifyDateTime = DateTimeObject.FormateToStringDB(actDate,'');
			var approvalToInsert = {};
			approvalToInsert.Signature_Name 	= vars.approvalId;
			approvalToInsert.Service_Order		= vars.recordToUpdate.Id;
			approvalToInsert.Customer_Name		= vars.recordToUpdate.WRTS_Contact_Person_Name__c;
			approvalToInsert.Customer_Email		= vars.recordToUpdate.WRTS_Contact_Person_Email__c;
			approvalToInsert.General_Remarks	= vars.recordToUpdate.General_Remarks__c;
			approvalToInsert.Signature			= vars.recordToUpdate.FSM_Signature__c;
			approvalToInsert.Work_Hour_Ids		= vars.ApprovedWHs;
			approvalToInsert.CreatedDate		= modifyDateTime;
			approvalToInsert.Installation_Name	= vars.Installation_Name;
			var toUpdateArray = [];
			toUpdateArray.push(approvalToInsert);
			sfSmartstore().upsertSoupEntries(SOUP_APPROVALS, toUpdateArray,
				function(items){
					WorkHours.ApproveServiceOrderToSmartStore();
				},
				function(error){
					LOG.store(error,toUpdateArray);
					WorkHours.ApproveServiceOrderToSmartStore();
				}
			);
		}catch(err){
			LOG.store(err);
			WorkHours.ApproveServiceOrderToSmartStore();
		}
	};

	/* Updates Service Order to SmartStore and Marks it as Approved */
	this.ApproveServiceOrderToSmartStore = function(){
		try{
			// mark this Service Order as Approved
			//vars.recordToUpdate.isApproved = true;
			vars.recordToUpdate.WRTS_Contact_Person_Name__c = "";
			vars.recordToUpdate.WRTS_Contact_Person_Email__c = "";
			vars.recordToUpdate.General_Remarks__c = "";
			vars.recordToUpdate.FSM_SignatureJSON__c = "";
			vars.recordToUpdate.FSM_Signature__c = "";
			var toUpdateArray = [];
			toUpdateArray.push(vars.recordToUpdate);
			sfSmartstore().upsertSoupEntriesWithExternalId(SOUP_WORK_ORDER, toUpdateArray,"Id",
				function(items){
					WorkHours.RefreshAfterApproval();
				},
				function(error){
					LOG.store(error,toUpdateArray);
					WorkHours.RefreshAfterApproval();
				}
			);
		}catch(err){
			LOG.store(err);
			WorkHours.RefreshAfterApproval();
		}
	};

	/* This closes Approval Pop-up, refresheS Work Hours Tab, after successful submitting of signature and data to approve */
	this.RefreshAfterApproval = function(){
		try{
			setTimeout(function(){
				$.mobile.loading('hide');
			}, 2);
			WorkHours.closeApprovalPopup();
			alert('Your Customer Approval will be sent when you click "Synchronize" button');
			var Param = jQuery.extend(true, {}, METHOD_PARAMETERS);
			Param.Parameters.MethodRunner = "RefreshWorkHours";
			Param.RecordId = RecordId;
			MethodsRunner.ProccessMethods(Param);
		}catch(err){
			LOG.store(err);
		}
	};

	/* This redraws and resized Signature Box when user resizes screen, or when he swap between Landscape and Portrait mode */
	this.resize_signature = function(){
		try{
			if($.mobile.activePage.find('#work-hours-approval-popup-popup').hasClass("ui-popup-active")){
				WorkHours.resetApprovalBox();
				if(vars.FSM_SignatureJSON__c !== undefined && vars.FSM_SignatureJSON__c !== null && vars.FSM_SignatureJSON__c !== ""){
					$('#sigBox').signature({disabled: true});
					$('#sigBox').signature('draw', vars.FSM_SignatureJSON__c);
				}else{
					// else -> canvas is empty and enabled, SIGN on, SUBMIT off
					$('#sigBox').signature();
				}
				$('#work-hours-approval-popup-container').click();
			}
			//else{ do nothing when approval pop-up is closed }
		}catch(err){
			// actually, we don't want to show error when sigBox is not created :/
			// especially when approval pop-up is not open
		}
	};

}
window.onload = window.onresize = function() {WorkHours.resize_signature();}; // this makes application to recognize when was screen resized