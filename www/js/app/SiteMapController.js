var SiteMaps = new SiteMap();

function SiteMap(){

	var RecordId 	= "";
	var Parameters  = {};
	var PageDiv 	= "#site-panel";
	var EquipMap	= {};
	var Coordinator = "";

	this.SiteMapController = function(parameters){
		try{
			SiteMaps.Parameters = parameters;
			SiteMaps.RecordId = parameters.RecordId;
			EquipMap = {};
			getSmartStoreData();
		}
		catch(err){
			LOG.store(err,{"Where":"SiteMapController","parameters":parameters});
		}
	};

	function getSmartStoreData(){
		try{
			var SQL_PARAMS = SQLTable[SiteMaps.Parameters.SQL];
			var iLimit = SQL_PARAMS.LIMIT;
			var sWHERE = SQL_PARAMS.WHERE;
			var sORDERBY = SQL_PARAMS.ORDERBY;
			var SOUP_SQL= SQL_PARAMS.SQL;

			var Params = {Ids:[], VariableType : "String", ReplaceValue : ":RecordId", VariableValue : SiteMaps.RecordId};
			var WHERE = ReplaceSQLParameters(sWHERE,Params);
			logToConsole()("SQLite for [ " + SOUP_SQL+WHERE +sORDERBY +" ]");

			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+WHERE+sORDERBY, iLimit);
			sfSmartstore().runSmartQuery(querySpec, function(cursor) {
				var page = cursor.currentPageOrderedEntries;
				onSuccessSMDataRetrieve(page);
			},function(error){
				LOG.store(error,{"Where":"SiteMap - getSmartStoreData - runSmartQuery","Query":querySpec,"Service Order":SiteMaps.RecordId});
			});
		}
		catch(err){
			LOG.store(err,{"Where":"SiteMap - getSmartStoreData","Service Order":SiteMaps.RecordId,"Parameters":SiteMaps.Parameters});
		}
	}

	function onSuccessSMDataRetrieve(response){
		try{
			var INS = JSON.parse(response[0][1]);
			Coordinator = response[0][3];
			var EQ = [];
			var equip;
			for (var i = 0,j=response.length; i < j; i++) {
				equip = response[i][2];
				if(equip !== undefined && equip !== null && equip !== ""){
					equip = JSON.parse(equip);
					EQ.push(equip);
					EquipMap[equip.Id] = equip;
				}
			}
			var ACC;
			if(INS.SUPERIOR_FUNCTIONAL_LOCATION__r !== undefined){
				ACC = INS.SUPERIOR_FUNCTIONAL_LOCATION__r;
			}else{
				ACC = {Id:"",Name:"",SERVICES_AM_ID__c:"",SERVICES_AM_ID__r:{},S_Customer_Value_Category__c:""};
			}
			var panel = $(PageDiv);
			panel.html("");

			panel.append(drawInstallationInfo(INS,ACC));
			panel.append(drawAccountSection(ACC.SERVICES_AM_ID__r));

			var ValueCategory = $('<p>Customer Value Category<br/></p>');
			var valCategory = checkFieldValue(ACC.S_Customer_Value_Category__c,"string");
			ValueCategory.append('<span class="site-padl">'+valCategory+'</span></br>');

			panel.append(ValueCategory);

			panel.append('<hr/>');
			if(INS.Installation_Cluster__c !== "Stock"){
				panel.append(drawEquipmentSection(EQ));
			}else{
				panel.append('<p>Equipment are not displayed for STOCK Installations</p>');
			}
			panel.trigger("create");
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - onSuccessSMDataRetrieve","response":response});
		}
	}

	function drawInstallationInfo(INS, ACC){
		var infoTable = $('<table class="site-table"></table>');
		try{
			var Ins_Name = checkFieldValue(INS.Name,"string");
			var row1 = $('<tr><td><label class="bold">Installation Name</label></td><td><label class="bold">'+Ins_Name+'</label></td></tr>');
			infoTable.append(row1);

			var Acc_Name = checkFieldValue(ACC.Name,"string");
			var row2 = $('<tr><td>Account</td><td>'+Acc_Name+'</td></tr>');
			infoTable.append(row2);

			var Inst_Type = checkFieldValue(INS.Installation_Type__c,"string");
			var row3 = $('<tr><td>Installation Type</td><td>'+Inst_Type+'</td></tr>');
			infoTable.append(row3);

			var Countr_Reg = checkFieldValue(INS.Country_of_Registration__c,"string");
			var row4 = $('<tr><td>Country of Registration</td><td>'+Countr_Reg+'</td></tr>');
			infoTable.append(row4);

			var Countr_Oper = checkFieldValue(INS.Country_of_Operation__c,"string");
			var row5 = $('<tr><td>Country of Operation</td><td>'+Countr_Oper+'</td></tr>');
			infoTable.append(row5);

			var Class_Soc = checkFieldValue(INS.Classification_Society__c,"string");
			var row6 = $('<tr><td>Classification Society</td><td>'+Class_Soc+'</td></tr>');
			infoTable.append(row6);

			var IMO = checkFieldValue(INS.LR_IMO_Ship_ID__c,"string");
			IMO = IMO.replace(/^0+/, '');//remove leading zeros
			var ahref = '';
			if(IMO !==''){
				var onclk = "window.open('http://www.marinetraffic.com/en/ais/details/ships/"+IMO+"','_system');";
				ahref = '<a href="#" onclick="'+onclk+'">Vessel at Marine Traffic</a>';
			}
			var row8 = $('<tr><td>Custom Link</td><td>'+ahref+'</td></tr>');
			infoTable.append(row8);
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - drawInstallationInfo","Installation":INS,"Account":ACC});
			infoTable.append('<tr><td>Something went wrong with information about Installation</td><td>'+err+'</td></tr>');
			infoTable.append('<tr><td>Please, contact your administrators</td><td>and send them screen-shot of this</td></tr>');
		}
		return infoTable;
	}
	
	function drawAccountSection(SAM){
		var AccountSection = $('<p>Service Account Manager<br/></p>');
		try{
			if(SAM === undefined || SAM === null || SAM === ''){
				SAM = {Name:"",Phone:"",Email:""};
			}
			var accMngName = checkFieldValue(SAM.Name,"string");
			if(accMngName !== ''){
				AccountSection.append('<span class="site-padl">'+accMngName+'</span></br>');
			}
			var accMngPhone = checkFieldValue(SAM.Phone,"string");
			if(accMngPhone !== ''){
				AccountSection.append('<span class="site-padl">'+accMngPhone+'</span></br>');
			}
			var accMngEmail = checkFieldValue(SAM.Email,"string");
			if(accMngEmail !== ''){
				AccountSection.append('<span class="site-padl">'+accMngEmail+'</span></br>');
			}
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - drawAccountSection","Service Account Manager":SAM});
			AccountSection.append('<span class="site-padl">Something went wrong with information about Account:</span></br>');
			AccountSection.append('<span class="site-padl">'+err+'</span></br>');
			AccountSection.append('<span class="site-padl">Please, contact your administrators and send them screen-shot of this</span></br>');
		}
		return AccountSection;
	}

	function drawEquipmentSection(EQ){
		var equpmentSection = $('<div></div>');
		try{
			equpmentSection.append('<H3>Equipment</H3>');
			var Engine;
			var isEven = false;
			var divClass;
			var leftPart;
			var rightPart;
			var reportNewLeadButton;
			for(var i = 0, j = EQ.length;i<j;i++){
				Engine = EQ[i];
				if(isEven){
					divClass = ' eq-white';
				}else{
					divClass = '';
				}
				leftPart = '<div class="w40 pad-l">'+checkFieldValue(Engine.Equipment_Category__c,"string")+'</div>';
				reportNewLeadButton = drawReportLeadButton(Engine);
				rightPart = '<div class="w60">'+checkFieldValue(Engine.Equipment_Text__c,"string")+'<br/>'+reportNewLeadButton+'</div>';
				equpmentSection.append('<div class="site-eq-table'+divClass+'">'+leftPart+rightPart+'</div>');
				isEven = !isEven;
			}
		}
		catch(err){
			LOG.store(err,{"Where":"SiteMap - drawEquipmentSection","EQ":EQ});
			equpmentSection.append('<span>Something went wrong with Equipment Section:</span></br>');
			equpmentSection.append('<span>'+err+'</span></br>');
			equpmentSection.append('<span>Please, contact your administrators and send them screen-shot of this</span></br>');
		}
		return equpmentSection;
	}

	function drawReportLeadButton(Engine){
		var reportButton = '';
		try{
			reportButton = '<button id="'+Engine.Id+'" class="report-lead-btn sharp-corners"';
			reportButton += ' onclick="SiteMaps.openReportLeadPopup(\''+Engine.Id+'\')">';
			reportButton += 'Report New Sales Potential</button>';
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - drawReportLeadButton","Engine":Engine});
		}
		return reportButton;
	}

	this.openReportLeadPopup = function(EquipmentId){
		try{
			var container = $("#site-popup-container");
			document.getElementById("report-lead-popup").style.display = "none";
			$("#report-lead-popup").popup("close");
			container.html("");
			var Equip = EquipMap[EquipmentId];
			
			var title = '<label>Equipment<br/>'+Equip.Equipment_Text__c+'</label><br/>';
			container.append(title);

			var comments = '<label>Comments</label><textarea id="report-lead-input"></textarea><br/>';
			container.append(comments);

			var checkboxTable = '<table><tr>';
			checkboxTable += '<td><label for="changeorder" data-role="none">This is a Change Order</label></td>';
			checkboxTable += '<td><div class="site-checkbox"><input type="checkbox" data-role="none" id="changeorder"/></div></td>';
			checkboxTable += '</tr><tr>';
			checkboxTable += '<td><label for="highpriority" data-role="none" >High Priority</label></td>';
			checkboxTable += '<td><div class="site-checkbox"><input type="checkbox" data-role="none" id="highpriority"/></div></td>';
			checkboxTable += '</tr><table>';
			container.append(checkboxTable);

			var cameraButton = "<div id='sitecamera' class='float-left'><img src='images/icons/picture40x28.png' onclick='SiteMaps.takePicture()'/></div>";
			
			var submitSection = "<p>"+cameraButton;
			submitSection +=		"<div class='wartsila-btn orange float-right' onclick='SiteMaps.storeReport(\""+EquipmentId+"\");'>Submit</div>";
			submitSection +=		"<div class='clear-both'></div>";
			submitSection +=	"</p>";
			container.append(submitSection);

			container.append(makePreviousReports());

			$.when(container.trigger("create")).done(function(){
				document.getElementById("report-lead-popup").style.display = "block";
				$("#report-lead-popup").popup("open");
			});

		}catch(err){
			LOG.store(err,{"Where":"SiteMap - openReportLeadPopup","EquipmentId":EquipmentId});
		}
	};

	this.storeReport = function(EquipmentId){
		try{
			var task = fillNewReport(EquipmentId);
			var taskToInsert = [ task ];
			sfSmartstore().upsertSoupEntries(SOUP_TASK, taskToInsert,
				function(items) {
					$("#report-lead-popup").popup("close");
					alert('Your New Sales Potential Report is saved locally and will be sent when you click "Synchronize" button');
				},
				function(error)	{
					LOG.store(error,{"Where":"SiteMap - storeReport - upsertSoupEntries","taskToInsert":taskToInsert});
				}
			);
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - storeReport","EquipmentId":EquipmentId});
		}
	};

	function fillNewReport(EquipmentId){
		var task = {Service_Order__c:"",Description:"",WhatId:"",SaveStatus:"",
					ActivityDate:"",Subject:"",pictureUri:"",Sub_Status__c:"",
					FS_Mobility_ExternalId__c:"",Priority:"",isChangeOrder__c:"",Installation__c:""};
		try{
			var equip = EquipMap[EquipmentId];
			var equipText = equip.Equipment_Text__c+'\n';
			var installationId = equip.Installation__c;
			task.Service_Order__c = SiteMaps.RecordId;
			task.Description = equipText+document.getElementById('report-lead-input').value;
			task.WhatId = EquipmentId;
			task.AssignedTo = Coordinator;
			task.SaveStatus = VALUE_SAVE_LOCAL;
			var actDate = new Date();
			task.ActivityDate = DateTimeObject.FormateToStringDB(actDate,'');
			task.Subject = 'New Sales Potential';
			task.FS_Mobility_ExternalId__c = SmartStoreManager.GeneratorID();
			task.Sub_Status__c = 'Not Uploaded';
			task.Installation__c = installationId;
			if(document.getElementById('highpriority').checked){
				task.Priority = 'High';
			}else{
				task.Priority = 'Medium';
			}
			task.isChangeOrder__c = document.getElementById('changeorder').checked;
			var pic = document.getElementById('pictureTask');
			if(pic !== undefined && pic !== null){
				task.pictureUri = checkFieldValue(pic.getAttribute('pictureUri'),"string");
			}
		}catch(err){
			LOG.store(err,{"Where":"SiteMap - fillNewReport","EquipmentId":EquipmentId});
			task.SaveStatus = "Error during Saving a new Report";
			task.Description = ""+err;
		}
		return task;
	}

	this.takePicture = function(){
		try{
			navigator.camera.getPicture(function(success){
				$("#sitecamera").empty();
				var pictureFileName = success.substring(success.lastIndexOf('/') + 1);
				var pictureContent = "<div style='width:100%' ><a href='#' class='float-left' id='pictureTask' pictureUri=\"" + success +
					"\" onclick='window.open(\"" + success + "\", \"_blank\")'>" + pictureFileName + "</a>" + 
						"<img src='images/icons/delete-24.png' class='float-right' style='padding-left:2em' onclick='SiteMaps.removePicture()'/></div>";
				$("#sitecamera").append(pictureContent);
				$("#sitecamera").trigger("create");
			},
			function(fail){
				//Callback when picture failed or user canceled 
			},
			{
				quality: 25,
				destinationType : navigator.camera.DestinationType.FILE_URI 
			});
		}
		catch(err){
			LOG.handle(err,"SiteMapController method takePicture raised an error: " + err.message);
		}
	};

	this.removePicture = function(){
		$("#sitecamera").empty();
		$("#sitecamera").append("<img src='images/icons/picture40x28.png' onclick='SiteMaps.takePicture();'/>");
		$("#sitecamera").trigger("create");
	};

	function makePreviousReports(){
		var tasks = $('<div></div>');
		try{
			var sqlOR = "";
			for(var key in EquipMap){
				if(EquipMap.hasOwnProperty(key)){
					sqlOR += "OR {"+SOUP_TASK+":WhatId} = '"+key+"' ";
				}
			}
			sqlOR = sqlOR.slice(3);
			var SOUP_SQL= "Select {"+SOUP_TASK+":_soup} from {"+SOUP_TASK+"}";
			var sWHERE = " where "+sqlOR;
			var sORDERBY = "order by case when {" + SOUP_TASK + ":CreatedDate} is null then 0 else 1 end,{" + SOUP_TASK + ":CreatedDate} desc";
			var querySpec = sfSmartstore().buildSmartQuerySpec(SOUP_SQL+sWHERE+sORDERBY, 500);
			sfSmartstore().runSmartQuery(querySpec, function(cursor){
				var response = cursor.currentPageOrderedEntries;
				if((response!==null) && (response.length>0)){
					var task,createdBy,head,description,rejection,bottom;

					for(var i = 0, j = response.length;i<j;i++){
						tasks.append('<hr/>');
						task = response[i][0];
						createdBy = "";
						if(task.SaveStatus == VALUE_SAVE_LOCAL){
							createdBy = MainObject.userData.Name;
						}
						else{
							if ((task.CreatedBy !== undefined) && (task.CreatedBy !== null)){
								if ((task.CreatedBy.Name !== undefined) && (task.CreatedBy.Name !== null)){
									createdBy = task.CreatedBy.Name;
								}
							}
						}
						var formatedDate = "";
						if((task.CreatedDate !== null) && (task.CreatedDate !== undefined))
							formatedDate = DateTimeObject.FromSFDateTimeToDDMMYYYYFormat(task.CreatedDate);
						else{
							formatedDate = DateTimeObject.fullDate(new Date());
						}
						head = '<p class="small">'+createdBy+', Field Service Engineer</p>';
						description = '<pre class="medium">'+checkFieldValue(task.Description,"string")+'</pre>';
						rejection = (task.Reason_for_Rejection__c?'<pre class="medium">Reason for rejection:\n'+task.Reason_for_Rejection__c+'</pre>':'');
						bottom = '<p><span class="float-left small">'+task.Sub_Status__c+'</span><span class="float-right small">'+formatedDate+'</span></p><br/>';						
						tasks.append('<div>'+head+description+rejection+bottom+'</div>');
					}
				}
			},function(error){LOG.store(error,{"Query:":querySpec});});
		}
		catch(err){
			LOG.store(err);
			alert("Could not obtain previous Reports because of the following error: " + err.message);
		}
		return tasks;
	}

}