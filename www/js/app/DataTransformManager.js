/*
  @Author: Juraj Ciljak, 
  @email:juraj.ciljak@accenture.com,
  @LastModified: 9.9.2015; 
  @Description: Object to transform response from SmartStore to the data on the html page
  @WARNING: 
*/

var DataTransManager = new DataTransformManager();

function DataTransformManager(){

	this.DataTrans_ForOperationsPopUp = function(response){
		var Result_Data = [];
		try{
			if (!response) {return [];}
			var Result = {};
			var FSC_Buffer = []; // Gather Coordinator Notes
			var FSE_Buffer = []; // Gather Engineer Notes
			var argObject = { Name:BREAK_FIELD_NAME, sValue:"" , nValue:0, fdType:"string"};
			Result_Data.push(argObject);

			for(var i = 0, j = response.length; i < j; i++){
				var entry = response[i];
				var operation_Id  = entry[0].Id;
				var operation_line = Result[operation_Id];
				var FSE_Notes = {};	// Engineer Notes
				if(operation_line===undefined){
					operation_line =  jQuery.extend(true, {}, OPPERATION_LINE);
					operation_line.Id=operation_Id;
					operation_line.Name = checkFieldValue(entry[0].Name,"string");
					operation_line.WRTS_Operation_description__c = checkFieldValue(entry[0].WRTS_Operation_description__c,"string");
					operation_line.WRTS_Operation_Progress__c = checkFieldValue(entry[0].WRTS_Operation_Progress__c,"integer");
					operation_line.WRTS_Total_Duration__c = checkFieldValue(entry[0].WRTS_Total_Duration__c,"string");
					operation_line.WRTS_Total_Duration_unit__c = checkFieldValue(entry[0].WRTS_Total_Duration_unit__c,"string");
					operation_line.CKSW__Early_Start_Date__c = checkFieldValue(entry[0].CKSW__Early_Start_Date__c,"date");
					operation_line.CKSW__Due_Date_Date__c = checkFieldValue(entry[0].CKSW__Due_Date_Date__c,"date");
					operation_line.CKSW__Notes__c = checkFieldValue(entry[0].CKSW__Notes__c,"string");
					operation_line.WRTS_Operation_Line_number__c = checkFieldValue(entry[0].WRTS_Operation_Line_number__c,"string");
					operation_line.CKSW__City__c = checkFieldValue(entry[0].CKSW__City__c,"string");
					operation_line.CKSW__Country__c = checkFieldValue(entry[0].CKSW__Country__c,"string");
					var separator = ((operation_line.CKSW__City__c===''||operation_line.CKSW__Country__c==='')?'':' / ');
					operation_line.Location = operation_line.CKSW__City__c + separator + operation_line.CKSW__Country__c;
					operation_line.FSE_Notes = {};
					operation_line.FS_Coordinator_Notes = {};

					var argObject1 = { Name:HIDDEN_RECORD_ID,  sValue: operation_line.Id , API_Name:"Id"+API_VALUE_SEPARATOR+operation_line.Id, fdType:"string"};
					Result_Data.push(argObject1);

					var argObject2 = { Name: OPERATION_DESCRIPTION_NAME,  sValue: operation_line.WRTS_Operation_description__c , API_Name: OPERATION_DESCRIPTION_API, fdType:"string"};
					Result_Data.push(argObject2);

					var argObject3 = { Name:"ID" ,  sValue: operation_line.WRTS_Operation_Line_number__c , API_Name:"WRTS_Operation_Line_number__c", fdType:"string"};
					Result_Data.push(argObject3);

					var Hours = operation_line.WRTS_Total_Duration__c +' '+operation_line.WRTS_Total_Duration_unit__c;
					var argObject4 = { Name:"Total Duration" ,  sValue: Hours , API_Name:"WRTS_Total_Duration__c", fdType:"string"};
					Result_Data.push(argObject4);

					var argObject5 = { Name:"Basic Start" ,  sValue: operation_line.CKSW__Early_Start_Date__c,  API_Name:"CKSW__Early_Start_Date__c", fdType:"date"};
					Result_Data.push(argObject5);

					var argObject6 = { Name:"Basic Finish" ,  sValue: operation_line.CKSW__Due_Date_Date__c ,  API_Name:"CKSW__Due_Date_Date__c", fdType:"date"};
					Result_Data.push(argObject6);

					var argObject61 = { Name:"Place / Country" ,  sValue: operation_line.Location ,  API_Name:"Location", fdType:"string"};
					Result_Data.push(argObject61);

					var argObject7 = { Name:BREAK_FIELD_NAME, sValue:"" , API_Name:"", fdType:"string"};
					Result_Data.push(argObject7);

					var argObject8 = { Name:FIELD_NAME_PROGRESS ,  sValue: operation_line.WRTS_Operation_Progress__c , API_Name:"WRTS_Operation_Progress__c", fdType:"string"};
					Result_Data.push(argObject8);

					Result[operation_Id] = operation_line;
				}
				var notes_Id;
				var notes_line ;
				var FS_Coordinator_Note = entry[2];
				if(FS_Coordinator_Note){
					//parse FS_Coordinator_Note and push it to Result_Data
					// check if operation has this note
					FS_Coordinator_Note = JSON.parse(FS_Coordinator_Note);
					notes_Id = FS_Coordinator_Note.Id;
					var Operation_FS_Coordinator_Notes = operation_line.FS_Coordinator_Notes[notes_Id];
					if(!Operation_FS_Coordinator_Notes){
						//Operation does not have this Note, so lets create and give him one
						notes_line = jQuery.extend(true, {}, FS_COORDINATOR_NOTES); 
						notes_line.Id = notes_Id; 
						notes_line.Name = checkFieldValue(FS_Coordinator_Note.Name,"string");
						notes_line.Operation__c = checkFieldValue(FS_Coordinator_Note.Operation__c,"string");
						notes_line.Title__c = checkFieldValue(FS_Coordinator_Note.Title__c,"string");
						notes_line.Text__c = checkFieldValue(FS_Coordinator_Note.Text__c,"string");

						var argObject9 = { Name:FIELD_NAME_FSC_NOTE, sValue: notes_line.Text__c ,API_Name:"Id"+API_VALUE_SEPARATOR+notes_line.Id, nValue:0, fdType:"string"};
						//Result_Data.push(argObject); // we will do this later
						FSC_Buffer.push(argObject9);    // instead we store it to buffer
						operation_line.FS_Coordinator_Notes[notes_Id] = notes_line;
					}
				}
				FSE_Notes = entry[1]; //Left Join To the FSE_Notes // be careful about index from select

				var Operation_FSE_Notes = {};
				if(FSE_Notes){
					try{
						FSE_Notes = JSON.parse( FSE_Notes );
					}
					catch(e){
						//some object for login error
					}
					notes_Id = FSE_Notes.Id;
					Operation_FSE_Notes = operation_line.FSE_Notes;
					notes_line = undefined ;
					if(Operation_FSE_Notes!==undefined){
						notes_line = Operation_FSE_Notes[notes_Id];
					}
					if(notes_line===undefined){
						notes_line = jQuery.extend(true, {}, FSE_NOTES); 
						notes_line.Id = notes_Id; 
						notes_line.Name = checkFieldValue(FSE_Notes.Name,"string");
						notes_line.Notes__c = checkFieldValue(FSE_Notes.Notes__c,"string");
						notes_line.CreatedDate = checkFieldValue(FSE_Notes.CreatedDate,"dateTime");
						notes_line.Operation__c = checkFieldValue(FSE_Notes.Operation__c,"string");
						FSE_Notes= notes_line.Notes__c;
						var argObject10 = { Name: HIDDEN_NOTES_ID ,  sValue: notes_Id, API_Name:"Id"+API_VALUE_SEPARATOR+notes_Id, fdType:"string"};
						//Result_Data.push(argObject); // we will do this later
						FSE_Buffer.push(argObject10);

						var argObject11 = { Name: FIELD_NAME_FSE_NOTE ,  sValue: FSE_Notes,  API_Name:"Notes__c"+API_VALUE_SEPARATOR+notes_Id, fdType:"string"};
						//Result_Data.push(argObject); // we will do this later
						FSE_Buffer.push(argObject11);
						operation_line.FSE_Notes[notes_Id]=notes_line;
					}
				}
				else{
					// Operation does not have FSE_Note, lets create it
					// but only once, so lets check that operation_line.FSE_Notes is empty {}
					if(JSON.stringify(operation_line.FSE_Notes) == '{}'){
						notes_Id = SmartStoreManager.GeneratorID();
						notes_line = jQuery.extend(true, {}, FSE_NOTES);
						notes_line.Id = notes_Id; 
						notes_line.Name = '';
						notes_line.Notes__c = '';
						notes_line.CreatedDate = '';
						notes_line.Operation__c = operation_Id;
						FSE_Notes= notes_line.Notes__c;
						var argObject12 = { Name: HIDDEN_NOTES_ID ,  sValue: notes_Id, API_Name:"Id"+API_VALUE_SEPARATOR, fdType:"string"};
						//Result_Data.push(argObject);// we will do this later
						FSE_Buffer.push(argObject12);

						var argObject13 = { Name: FIELD_NAME_FSE_NOTE ,  sValue: FSE_Notes, API_Name:"Notes__c"+API_VALUE_SEPARATOR, fdType:"string"};
						//Result_Data.push(argObject);// we will do this later
						FSE_Buffer.push(argObject13);
						operation_line.FSE_Notes[notes_Id]=notes_line;
					}
				}
			}
			// now we push Buffered Coordinator Notes
			for(var ii = 0, jj = FSC_Buffer.length; ii < jj; ii++){
				Result_Data.push(FSC_Buffer[ii]);
			}
			// now we push Buffered Engineer Notes
			for(var k = 0, l = FSE_Buffer.length; k < l; k++){
				Result_Data.push(FSE_Buffer[k]);
			}
		}
		catch(err){
			LOG.store(err,response);
			return [];
		}
		return Result_Data;
	};

	this.DataTrans_ForWorkHoursPopUp = function(response){
		var Result = {};
		try{
			if(!response){return {};}
			/* JSON Structure
				Result = {"User Data":
								{"XYZ":{Id:"XYZ",sValue:"Juraj Ciljak"}
										},
						  "Work Type":{},
						  "Work Location":{},
						  "Resource":{}
						}
			*/
			var userValue = {};
			userValue[MainObject.userData.Id] = {Name:USER_DATA, sValue: MainObject.userData.Name, API_Name:USER_NAME,fdType:"string", Id:MainObject.userData.Id };

			Result[USER_DATA] = userValue;
			
			var s_Value = '';
			for(var i = 0, j = response.length; i < j; i++){
				var entry = response[i];
				var line_Id  = entry[0].Id;
				s_Value = '';
				var type = entry[1];
				userValue = Result[type];
				if((userValue===undefined) || (userValue===null) || (userValue==NaN) ){
					Result[type] = {};
				}
				userValue = Result[type];
				var data_line = userValue[line_Id];
				if((data_line===undefined) || (data_line===null) || (data_line==NaN) ){
					switch(type){
						case TYPE_WORKHOURS:
							s_Value = checkFieldValue(entry[0].Type__c,"string");
							data_line = {Name:TYPE_WORKHOURS, sValue: s_Value, API_Name:entry[0].Id,fdType:"string", Id:line_Id };
					 		line_Id = s_Value; 
						break;
						case TYPE_RESOURCE:
							data_line = {Name: TYPE_RESOURCE, sValue: checkFieldValue(entry[0].Name,"string"),
											 API_Name:entry[0].Id,fdType:"string", Id:line_Id ,
											 Data :{ CKSW__User__c: checkFieldValue(entry[0].CKSW__User__c,"string")}
											};
						break;
					}
				}
				userValue[line_Id] = data_line;
			}
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	this.DataTrans_ForWorkHoursDetail = function(response){
		var Result = {};
		try{
			if(!response) {return {};}
			for(var i = 0, j = response.length; i < j; i++){
				var entry = response[i];
				var wh_Id = entry[0].Id; //time report ID
				var wh_line = Result[wh_Id];
				var Work_Hours = {};
				var names;

				var rs_name = entry[3];
				var type = entry[1]; // work hour type
				var hrs = entry[2]; // sum of hours per date, per resource, per type
				var work_Id = entry[4];// work hour ID
				var work_Name = entry[5];// work hour name
				//Maria Ciskova 10.9.2015
				var wh_temp = WH_LINE.CKSW__Engineer_Equipment__c[rs_name];
				if(wh_line===undefined){
					wh_line = jQuery.extend(true, {}, WH_LINE);
					wh_line.Id = wh_Id;
					wh_line.Report_Date__c = checkFieldValue(entry[0].Report_Date__c,"date");
					wh_line.CKSW__Engineer_Equipment__c = {};
				}
				wh_temp = wh_line.CKSW__Engineer_Equipment__c[rs_name];
				if(wh_temp===undefined){
					names = jQuery.extend(true, {}, RES_NAME); 
					names.Name = checkFieldValue(rs_name,"string");
				}
				wh_line.CKSW__Engineer_Equipment__c[rs_name] = names;
				var wh_temp2 = wh_line.CKSW__Engineer_Equipment__c[type];
				if(wh_temp2===undefined){
					Work_Hours = jQuery.extend(true, {}, WH_HOURS);
					Work_Hours.Type__c = checkFieldValue(type,"string");
					Work_Hours.Reported_Hours__c = checkFieldValue(hrs,"integer");
					Work_Hours.Id = checkFieldValue(work_Id,"string");
					Work_Hours.Name = checkFieldValue(work_Name,"string");
					//Maria Ciskova 10.9.2015
				}
				names.Work_Hours__c[work_Id] = Work_Hours; 
				Result[wh_Id] = wh_line;
			}
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	//A method to sanitize the data received to chatter.
	//All new fields in the soup must be added here also in order to make them visible in the UI!
	this.DataTrans_ForServiceOrderChatt = function(response){
		var Result = {};
		try{
			for (var i = 0, j = response.length; i < j; i++){
				var entry = response[i];
				var feed_Id  = entry[0].Id;
				var feed_line = Result[feed_Id];
				var feed_UserName = '';
				var Feed_Comments = {};
				var Comment_UserName ='';
				if(entry[1] !== undefined){ 
					feed_UserName  =  checkFieldValue(entry[1],"string");  // be careful about index
				}
				if(entry[3] !== undefined){
					Comment_UserName  =  checkFieldValue(entry[3],"string");  // be careful about index from select
				}
				if(feed_line===undefined){
					feed_line =  jQuery.extend(true, {}, FEED_LINE);
					feed_line.Id=feed_Id;
					feed_line.ParentId = checkFieldValue(entry[0].ParentId,"string");
					feed_line.Title = checkFieldValue(entry[0].Title,"string");
					feed_line.ContentFileName= checkFieldValue(entry[0].ContentFileName,"string");
					feed_line.isDownloaded= checkFieldValue(entry[0].isDownloaded,"string");
					feed_line.Body= checkFieldValue(entry[0].Body,"string");
					feed_line.CreatedDate= checkFieldValue(entry[0].CreatedDate,"dateTime");
					feed_line.ContentSize= checkFieldValue(entry[0].ContentSize,"integer");
					feed_line.ContentFileName= checkFieldValue(entry[0].ContentFileName,"string");
					feed_line.pictureUri = checkFieldValue(entry[0].pictureUri, "string");
					if(entry[0].CreatedBy !== undefined && entry[0].CreatedBy.Name !== undefined && entry[0].CreatedBy.Name !== null){
						feed_line.UserName = entry[0].CreatedBy.Name;
						if(feed_line.UserName == feed_UserName){
							feed_line.isMyComment = true;
						}
					}else{
						feed_line.UserName = feed_UserName;
						feed_line.isMyComment = true;
					}
					feed_line.FeedComments = {};
					Result[feed_Id] = feed_line;
				}
				var Comments = entry[2]; //Left Join To the Feed Comments
				Feed_Comments = {};
				 
				if(Comments){
					var comment_line ;
					try{
						Comments = JSON.parse( Comments );
					}
					catch(e){
						//some object for login error 
						LOG.store(e,"DataTrans_ForSparePartDetail error:\n"+e);
					}
					var comment_Id = Comments.Id;
					Feed_Comments = feed_line.FeedComments;
					comment_line = Feed_Comments[comment_Id];

					if(comment_line===undefined){
						comment_line = jQuery.extend(true, {}, FEED_COMMENT); 
						comment_line.Id = comment_Id; 
						comment_line.FeedItemId = checkFieldValue(Comments.FeedItemId,"string");
						comment_line.ParentId = checkFieldValue(Comments.ParentId,"string");
						comment_line.CreatedDate = checkFieldValue(Comments.CreatedDate,"dateTime");
						comment_line.CommentBody = checkFieldValue(Comments.CommentBody,"string");
						comment_line.IsDeleted = checkFieldValue(Comments.IsDeleted,"string");
						comment_line.CommentType = checkFieldValue(Comments.CommentType,"string");
						comment_line.RelatedRecordId = checkFieldValue(Comments.RelatedRecordId,"string");
						comment_line.pictureUri = checkFieldValue(Comments.pictureUri, "string");
						comment_line.SaveStatus = VALUE_SAVE_SYNC;
						if(Comments.CreatedBy !== undefined && Comments.CreatedBy.Name !== undefined && Comments.CreatedBy.Name !== null){
							comment_line.UserName = Comments.CreatedBy.Name;
							if(comment_line.UserName == Comment_UserName){
								comment_line.isMyComment = true;
							}
						}else{
							comment_line.UserName = Comment_UserName;
							comment_line.isMyComment = true;
						}
						feed_line.FeedComments[comment_Id]=comment_line;
					}
				}
			}
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	// Denis Ivancik, 22th July 2015
	/* universal method that choses DataTransformer according to called Job */
	this.DataTrans_PushData = function(response,jobLine){
		var result = {};
		if(!response || !jobLine){
			return result;
		}
		try{
			switch(jobLine.Name){
				case "push_FSE_Notes":
					result = DataTransManager.DataTrans_ForOperationsPushData(response);
					break;
				case "push_TimeReports":					
					result = DataTransManager.DataTrans_ForTimeReportsPushData(response);
					break;
				case "push_CustomerApprovals":
					result = DataTransManager.DataTrans_Forpush_CustomerApprovalsData(response);
					break;
				case "push_Incidents":
					result = DataTransManager.DataTrans_ForIncidentPush(response);
					break;
				case "update_JSA":
					result = DataTransManager.DataTrans_ForJSAUpdate(response);
					break;
				case "update_JSA_Activities":
					result = DataTransManager.DataTrans_ForJSAActivityUpdate(response);
					break;
				case "push_Tasks":
					result = DataTransManager.DataTrans_ForPushTasks(response);
					break;
				case "push_Errors":
					result = DataTransManager.DataTrans_ForPushErrors(response);
					break;
				default:
					result = DataTransManager.DataTrans_ForOperationsPushData(response);
					break;
			}
		}
		catch(err){
			LOG.store(err,response);
		}
		return result;
	};

	this.DataTrans_ForOperationsPushData = function(response){
		var Result = {};
		try{
			if(!response){return {};}
			for (var i = 0, j = response.length; i < j; i++) {
				var entry = response[i];
				var Id  = entry[0].Id;
				var line = Result[Id];
				var FSE_Notes = {};
				if(line===undefined){
					line =  jQuery.extend(true, {}, PUSH_OPPERATION);   
					line.Id=Id;  
					line.Name = checkFieldValue(entry[0].Name,"string");
					line.WRTS_Operation_Progress__c = checkFieldValue(entry[0].WRTS_Operation_Progress__c,"integer");
					line.LastModifiedDate =  entry[0].LastModifiedDate;
					line.CreatedDate = entry[0].CreatedDate;
					line.FSE_Notes = {};

					Result[Id] = line;
				}
				FSE_Notes = entry[1]; //Left Join To the FSE_Notes // be careful about index from select
				if(FSE_Notes){
					try{
						FSE_Notes = JSON.parse( FSE_Notes );
					}
					catch(e){ 
						LOG.store(e,"DataTrans_ForOperationsPushData:\n"+FSE_Notes);
					}
					var line_item = FSE_Notes;
					var line_Id  = line_item.Id;
					var item = line.FSE_Notes[line_Id];
					if(item === undefined){
						item = jQuery.extend(true, {}, PUSH_FSE_NOTES);    
					}
					item.Notes__c = line_item.Notes__c;
					item.Id = line_item.Id;
					item.Operation__c = line_item.Operation__c;
					item.LastModifiedDate =  line_item.LastModifiedDate;
					item.CreatedDate = line_item.CreatedDate;
					item.FS_Mobility_ExternalId__c = line_item.FS_Mobility_ExternalId__c;
					line.FSE_Notes[line_Id] = item;
				}
			}
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	// Denis Ivancik, 22.7.2015
	// Maria Ciskova, 27.7.2015 
	/* DataTransformer method for sending Time Reports 
	   Takes Time Report, Time Entry and Work Hour data from SmartStore and transform to JSon structure to be sent to SalesForce
	*/
	this.DataTrans_ForTimeReportsPushData = function(response){
		var Result = {};
		if(!response){return {};}
		try{
			var ResultTimeReports = {};
			var ResultTimeEntries = {};
			var ResultWorkHours = {};
			// for each row of the Response
			for(var i = 0, l = response.length; i < l; i++){
				//in one response row there are 2 columns - soup data of the object at index 0, type of the object at index 1		
				var responseRow = response[i];
				var objectType = responseRow[0].attributes.type;

				// PROCESSING TIME REPORT
				if(objectType === "Time_Report__c"){
					var timeReport  = responseRow[0];
					var timeReport_Id = timeReport.Id;
					//Result record, that we are currently in - Result[currentTimeReportId]
					var resultTimeReport = ResultTimeReports[timeReport_Id];
					if(resultTimeReport === undefined){
						resultTimeReport = jQuery.extend(true, {}, PUSH_TIME_REPORT);  
						resultTimeReport.Id = timeReport_Id;  
						resultTimeReport.FS_Mobility_ExternalId__c = timeReport.FS_Mobility_ExternalId__c;
						resultTimeReport.Service_Order__c = checkFieldValue(timeReport.Service_Order__c,"string");
						resultTimeReport.Report_Date__c = checkFieldValue(timeReport.Report_Date__c,"string");
						resultTimeReport.LastModifiedDate =  timeReport.LastModifiedDate;						

						ResultTimeReports[timeReport_Id] = resultTimeReport;
					}
				}
				// PROCESSING TIME ENTRY
				else if (objectType == "Time_Entry__c"){
					var timeEntry  = responseRow[0];
					var timeEntry_Id = timeEntry.Id;
					var resultTimeEntry = ResultTimeEntries[timeEntry_Id];
					if(resultTimeEntry === undefined){
						resultTimeEntry =  jQuery.extend(true, {}, PUSH_TIME_ENTRY);   
						//filling up time entry and pushing it to the Result
						resultTimeEntry.Id = timeEntry.Id;
						resultTimeEntry.Resource__c = timeEntry.Resource__c;
						resultTimeEntry.FS_Mobility_ExternalId__c = timeEntry.FS_Mobility_ExternalId__c;
						resultTimeEntry.LastModifiedDate = timeEntry.LastModifiedDate;
						resultTimeEntry.Time_Report__c = timeEntry.Time_Report__c;
						resultTimeEntry.TimeReport_ExternalId = timeEntry.TimeReport_ExternalId;
						ResultTimeEntries[timeEntry_Id] = resultTimeEntry;
					}
				}
					// PROCESSING WORK HOUR
				else if (objectType == "Work_Hours__c"){
					var workHour = responseRow[0];
					var workHour_Id = workHour.Id;
					var resultWorkHour = ResultWorkHours[workHour_Id];
					if(resultWorkHour === undefined){
						resultWorkHour =  jQuery.extend(true, {}, PUSH_WORK_HOUR);
						//Id:"",Reported_Hours__c:"",Type__c:"",FS_Mobility_ExternalId__c:"",LastModifiedDate:"",FS_Mobility_ExternalId__c:""};
						//filling up workHour and pushing it to the Result
						resultWorkHour.Id = workHour.Id;
						resultWorkHour.Reported_Hours__c = workHour.Reported_Hours__c;//.toFixed(2);
						resultWorkHour.Type__c = workHour.Type__c;
						resultWorkHour.LastModifiedDate = workHour.LastModifiedDate;
						resultWorkHour.FS_Mobility_ExternalId__c = workHour.FS_Mobility_ExternalId__c;
						resultWorkHour.Time_Entry__c = workHour.Time_Entry__c;
						resultWorkHour.Start_Time__c = workHour.Start_Time__c;
						resultWorkHour.End_Time__c = workHour.End_Time__c;
						resultWorkHour.Location__c = workHour.Location__c;
						resultWorkHour.Approved__c = workHour.Approved__c;
						resultWorkHour.Comments__c = workHour.Comments__c;
						resultWorkHour.TimeEntry_ExternalId = workHour.TimeEntry_ExternalId;
						resultWorkHour.ApprovalId = workHour.FSM_ApprovalId__c;
						ResultWorkHours[workHour_Id] = resultWorkHour;
					}
				}
			}
			Result[SFDC_TIME_REPORT] = ResultTimeReports;
			Result[SFDC_TIME_ENTRY] = ResultTimeEntries;
			Result[SFDC_WORK_HOURS] = ResultWorkHours; 
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	this.DataTrans_Forpush_CustomerApprovalsData = function(response){
		var result = {};
		try{
			for(var i = 0, j = response.length; i<j ; i++){
				var entry = response[i];
				if(entry !== undefined){
					var line = {};
					//line.SynMobileDataId = entry.Signature_Name;
					line.Service_Order = entry.Service_Order;
					line.Customer_Name = entry.Customer_Name;
					line.Customer_Email = entry.Customer_Email;
					line.General_Remarks = entry.General_Remarks;
					line.Signature_Name = entry.Signature_Name;
					line.Work_Hour_Ids = entry.Work_Hour_Ids;
					line.CreatedDate = entry.CreatedDate;
					line.Signature = entry.Signature;
					line.Installation_Name__c = entry.Installation_Name;
					//result.push(line);
					result = line; //as long as we expect 1 approval per message send to Salesforce
				}
			}
		}
		catch(err){
			LOG.store(err,response);
			result = {};
		}
		return result;
	};

	this.DataTrans_ForIncidentPush = function(response){
		var Result = [];
		if(!response){
			return Result;
		}
		try{
			for(var i = 0, j = response.length; i < j; i++){
				var entry = response[i][0];
				var line =  jQuery.extend(true, {}, PUSH_INCIDENT);  
				line.Incident_Summary__c = entry.Incident_Summary__c;
				line.JSA_Activity__c = entry.JSA_Activity__c;
				line.Incident_type__c = entry.Incident_type__c;
				line.observer_involved_person__c = entry.observer_involved_person__c;
				line.Involved_parties__c = entry.Involved_parties__c;
				line.Risk_Potential__c = entry.Risk_Potential__c;

				if(entry.Observer_Involved_Resource__c)
				line.Observer_Involved_Resource__c = entry.Observer_Involved_Resource__c;
				line.Work_stopped_due_incident__c = entry.Work_stopped_due_incident__c;
				line.observer_involved_person__c = entry.observer_involved_person__c;

				Result.push({"Fields" : line, "PictureUris" : entry.PictureUris});
			}
		}catch(err){
			LOG.store(err,response);
			Result = [];
		}
		return Result;
	};

	this.DataTrans_ForJSAUpdate = function(response){
		if (!response){
			return [];
		}
		var Result = [];
		try{
			for(var i = 0, j = response.length; i < j; i++){
				var entry = response[i][0];
				var line =  jQuery.extend(true, {}, PUSH_JSA);
				line.Asbestos_Free_Certificate_Declaration__c = entry.Asbestos_Free_Certificate_Declaration__c;
				line.Dangerous_Goods_Storage__c = entry.Dangerous_Goods_Storage__c;
				line.Ventilation_Conditions__c = entry.Ventilation_Conditions__c;
				line.Waste_management__c = entry.Waste_management__c;
				line.Scaffolding_Certificate__c = entry.Scaffolding_Certificate__c;
				line.Other_Hazardous_Materials__c = entry.Other_Hazardous_Materials__c;
				line.Firefighting_quipment__c = entry.Firefighting_quipment__c;
				line.Emergency_Routes_and_Exits__c = entry.Emergency_Routes_and_Exits__c;
				line.General_Housekeeping_Work_Environment__c = entry.General_Housekeeping_Work_Environment__c;
				line.lifting_hoisting_equipment__c = entry.lifting_hoisting_equipment__c;
				line.State_of_Electrical_Systems__c = entry.State_of_Electrical_Systems__c;
				line.State_of_Hydraulic_Equipments__c = entry.State_of_Hydraulic_Equipments__c;
				line.Engine_specific_tools__c = entry.Engine_specific_tools__c;
				Result.push({"Fields" : line, "Id" : entry.Id});
			}
		}catch(err){
			LOG.store(err,response);
			Result = [];
		}
		return Result;
	};

	this.DataTrans_ForJSAActivityUpdate = function(response){
		var Result = {};
		if (!response){
			return Result;
		}
		try{
			var Activities = {};
			for (var i = 0, j = response.length; i < j; i++){
				var entry = response[i][0];
				var line =  jQuery.extend(true, {}, PUSH_JSA_ACTIVITY); 
				line.Approved__c = entry.Approved__c;
				line.Id = entry.Id;
				Activities[line.Id] = line;		
			}
			Result["JSA_Activity__c"] = Activities;
		}
		catch(err){
			LOG.store(err,response);
			Result = {};
		}
		return Result;
	};

	this.DataTrans_ForPushTasks = function(response){
		var result = [],i = 0,j,entry,task;
		var today = new Date(),
		d = today.getDate(),
		m = today.getMonth(),
		y = today.getFullYear(),
		dueDate = new Date(y, m, d+3);
		try{
			for(j = response.length; i < j; i++){
				entry = response[i][0];
				task = {};
				task.FS_Mobility_ExternalId__c = entry.FS_Mobility_ExternalId__c;
				task.OwnerId = entry.AssignedTo;
				task.WhatId = entry.WhatId;
				task.Service_Order__c = entry.Service_Order__c;
				task.ActivityDate = DateTimeObject.FormateToStringDB(dueDate,'');
				task.isChangeOrder__c = entry.isChangeOrder__c;
				task.Priority = entry.Priority;
				task.Description = entry.Description;
				task.Status = 'Not Started';
				task.Subject = 'FSM New Sales Potential';
				task.Task_Source__c = 'FSM';
				task.Installation__c = entry.Installation__c;
				result.push({"Fields" : task, "PictureUris" : entry.pictureUri});
			}
		}catch(err){
			LOG.store(err,response);
			result = [];
		}
		return result;
	};

	this.DataTrans_ForPushErrors = function(response){
		var result = [],i = 0,j,entry,errorLog;
		try{
			for(j = response.length; i < j; i++){
				entry = response[i][0];
				errorLog = {};
				errorLog.Description = entry.Description;
				errorLog.Message = entry.Message;
				errorLog.Number = entry.Number;
				errorLog.Name = entry.Name;
				errorLog.Stack = entry.Stack;
				errorLog.Variables = entry.Variables;
				errorLog.Day = entry.Day;
				result[i] = errorLog;
			}
		}catch(err){
			LOG.store(err,response);
			result = [];
		}
		return result;
	};

}