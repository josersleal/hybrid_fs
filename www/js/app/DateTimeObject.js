/*
  @Authors: Juraj Ciljak:juraj.ciljak@accenture.com
  @Description: Object designed for working with the DateTime format between SFDC and local device
*/
var DateTimeObject = new DateTimeClass();

function DateTimeClass(){

	var weekDay = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

	//2010-10-30T12:00:00.000+0000
	var dbDateFormat = "YYYY-MM-DD";
	var dateSeparator = "-";
	var timeSeparator=":";
	var dbTimeFormat="HH:MM:SS";
	var dbPostFixFormat=".000+0000";
	var SFDCdateTimeSeparator = "T";

	this.FormateToStringDB = function(aDate,TimeZone){
		//http://www.w3schools.com/jsref/jsref_obj_date.asp
		var Result = '';
		if((aDate===undefined) || (aDate===null)){return '';}
		try{
			var DateArr = dbDateFormat.split(dateSeparator);
			var spr = dateSeparator;
			var TimeArr = dbTimeFormat.split(timeSeparator);
			for(var i = 0, j = DateArr.length; i < j; i++){
				switch(DateArr[i]){
					case "YYYY":
						DateArr[i] = aDate.getFullYear().toString();
						break;
					case "MM":
						DateArr[i] = (aDate.getMonth()+1).toString();
						if(DateArr[i].length<=1){DateArr[i] = '0'+DateArr[i];}
						break;
					case "DD":
						DateArr[i] = aDate.getDate().toString();
						if(DateArr[i].length<=1){DateArr[i] = '0'+DateArr[i];}
					break;
				}
				if (i == DateArr.length-1){
					spr='';
				}
				Result = Result+ DateArr[i]+spr;
			}
			Result += 'T';
			spr = timeSeparator; 
			for(var k = 0, l = TimeArr.length; k < l; k++) { 
				switch(TimeArr[k]){
					case "HH":
						TimeArr[k] = aDate.getHours().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+TimeArr[k];}
					break;
					case "MM":
						TimeArr[k] = aDate.getMinutes().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+TimeArr[k];}
					break;
					case "SS":
						TimeArr[k] = aDate.getSeconds().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+TimeArr[k];}
					break;
				} 
				if (k == TimeArr.length-1) {spr='';}
				Result += TimeArr[k]+spr;
			}
			Result += dbPostFixFormat;
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - FormateToStringDB","aDate":aDate,"TimeZone":TimeZone});
			Result = '';
		}
		return Result;
	};

	// Should be merge with FormateToStringDB separate with some kind of parameter
	this.DateFormateToStringDB = function(aDate,TimeZone,dtType){
		//http://www.w3schools.com/jsref/jsref_obj_date.asp
		var Result = '';
		if(!aDate){return '';}
		if((dtType===undefined) || (dtType===null)) {dtType ='';}
		var ResultDate = '';
		var ResultTime = '';
		try{
			var DateArr = dbDateFormat.split(dateSeparator);
			var spr = dateSeparator;
			var TimeArr = dbTimeFormat.split(timeSeparator);
			for (var i = 0, j = DateArr.length; i < j; i++){
				switch(DateArr[i]){
					case "YYYY":
						DateArr[i] = aDate.getFullYear().toString();
						break;
					case "MM":
						DateArr[i] = (aDate.getMonth()+1).toString();
						if(DateArr[i].length<=1){DateArr[i] = '0'+(aDate.getMonth()+1).toString();}
					break;
					case "DD":
						 DateArr[i] = aDate.getDate().toString();
						 if(DateArr[i].length<=1){DateArr[i] = '0'+aDate.getDate().toString();}
					 break;
				}
				if (i == DateArr.length-1) {spr='';}
				ResultDate = ResultDate+ DateArr[i]+spr;
			}
			Result = ResultDate+'T';
			spr = timeSeparator;
			for(var k = 0, l = TimeArr.length; k < l; k++){
				switch(TimeArr[k]){
					case "HH":
						TimeArr[k] = aDate.getHours().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+aDate.getHours().toString();}
					break;
					case "MM":
						TimeArr[k] = aDate.getMinutes().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+aDate.getMinutes().toString();}
					break;
					case "SS":
						TimeArr[k] = aDate.getSeconds().toString();
						if(	TimeArr[k].length<=1){TimeArr[k] = '0'+aDate.getSeconds().toString();}
					break;
				}
				if (k == TimeArr.length-1) {spr='';}
				ResultTime = ResultTime+ TimeArr[k]+spr;
			}
			Result += dbPostFixFormat;
			switch(dtType){
				case "date":
					Result = ResultDate;
					break;
				default:
					break;
			}
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - DateFormateToStringDB","aDate":aDate,"TimeZone":TimeZone});
			Result = '';
		}
		return Result;
	};

	this.WeekDay = function(val){
		try{
			if(val){
				return weekDay[val.getDay()];
			}
			else{
				return checkFieldValue(undefined, "date");
			}
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - WeekDay","val":val});
		}
	};

	this.fullDate = function(val){
		try{
			if(val!==undefined){
				var day = val.getDate().toString();
				var month = (val.getMonth()+1).toString();
				var year = val.getFullYear().toString();
				if(day.length == 1){
					day = "0"+day;
				}
				if(month.length == 1){
					month = "0"+month;
				}
				var dateComb = day+"."+month+"."+year;
				return dateComb;
			}
			else{
				return checkFieldValue(undefined, "date");
			}
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - fullDate","val":val});
		}
	};

	//Martin - 21/7/2015
	//transform entered float time hours into HH:MM format
	this.TimeFormat = function(time){
		var ResultingTime = '';
		try{
			var x = time.toString();
			if(x.indexOf(".") == -1){
				x = x+".00";
			}
			x = x.split(".");
			var y = x[1];
			if(y.length == 1){
				y = y*10;
				y = y * 0.6;
				y = Math.round(y);
			}
			else{
				y = y * 0.6;
				y = Math.round(y);
			}
			if(y < 10){
				y = "0" + y;   
			}
			ResultingTime = x[0] + ":" + y + "h";
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - TimeFormat","time":time});
			ResultingTime = '';
		}
		return ResultingTime;
	};

	this.TimeDecimalToHHMM = function(decimal){
		var Result = '';
		try{
			var hours = Math.floor(decimal)*60;
			var inMinutes = Math.round(decimal*60);
			var minutes = inMinutes - hours;
			Result = DateTimeObject.AddZeros(hours/60)+":"+DateTimeObject.AddZeros(minutes)+"h";
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - TimeDecimalToHHMM","decimal":decimal});
			Result = '';
		}
		return Result;
	};

	this.TimeMinutesToDecimal = function(minutes){
		try{
			var decimal = parseFloat(minutes)/60;
			decimal = Math.round(decimal*100)/100;
			return decimal;
		}
		catch(err){
			LOG.store(err,{"Where":"DateTimeClass - TimeDecimalToHHMM","minutes":minutes});
		}
	};

	this.toEuropeanFormat = function(inputDate){
		var result = inputDate;
		try{
			var dateAray = inputDate.split('-');
			var l = dateAray.length;
			if(l > 1){
				result = dateAray[l-1];
				for(var i = l-2, j = 0;i>=j;i--){
					result += '.'+dateAray[i];
				}
				return result;
			}
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - toEuropeanFormat","inputDate":inputDate});
			result = inputDate;
		}
		return result;
	};

	this.parseTimeOnly = function(SFDC_DateTime){
		var result = "";
		try{
			if(SFDC_DateTime){
				var inputArray = SFDC_DateTime.split(SFDCdateTimeSeparator);
				if(inputArray.length > 1){
					var rawTime = inputArray[1];
					var timeArray = rawTime.split(timeSeparator);
					if(timeArray.length>1){
						result += timeArray[0]+":"+timeArray[1];
					}
				}
			}
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - parseTimeOnly","SFDC_DateTime":SFDC_DateTime});
		}
		return result;
	};

	//Maria Ciskova function expects Salesforce date time in format YYYY-MM-DDTHH:MM:SS.000+0000 -> 2010-10-30T12:00:00.000+0000
	this.FromSFDateTimeToHHMMTimeFormat = function(inputDateTime){
		try{
			var myTime = inputDateTime.substr(11, 5);
			if ((myTime !== null) && (myTime !== undefined))
				return myTime;
			else
				return "";
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - FromSFDateTimeToHHMMTimeFormat","inputDateTime":inputDateTime});
			return "";
		}
	};

	//Maria Ciskova function expects Salesforce date time in format YYYY-MM-DDTHH:MM:SS.000+0000 -> 2010-10-30T12:00:00.000+0000
	this.FromSFDateTimeToDDMMYYYYFormat = function(inputDateTime){
		var formatedDate = "";
		try{			
			var myDateTime = inputDateTime.toString().split("T")[0];
			var myDate = myDateTime.split("-");
			formatedDate = myDate[2] + "." + myDate[1] + "." + myDate[0];
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - FromSFDateTimeToDDMMYYYYFormat","inputDateTime":inputDateTime});
			formatedDate = "";		
		}
		return formatedDate;
	};
	
	//Maria Ciskova function expects time in format HH:MM
	this.GetHoursAndMinutesFromHHMMTime = function(inputTime){
		var myTime=[];
		try{
			var myHours = inputTime.substr(0, 2);
			var myMinutes = inputTime.substr(3, 2);
			if ((myHours !== undefined) && (myHours !== null))
				myTime.push(myHours);
			else
				myTime.push("");
			if ((myMinutes !== undefined) && (myMinutes !== null))
				myTime.push(myMinutes);
			else
				myTime.push("");
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - GetHoursAndMinutesFromHHMMTime","inputTime":inputTime});
		}
		return myTime;
	};

	//Maria Ciskova function adds "0" to one character long input or adds "00" when input is empty
	this.AddZeros = function(inputTime){
		try{
			inputTime = inputTime.toString();
			var myTime="";
			if(inputTime.length == 1)
				myTime = "0"+inputTime;
			else if(inputTime.length === 0)
				myTime = "00";
			else 
				myTime = inputTime;
			return myTime;
		}catch(err){
			LOG.store(err,{"Where":"DateTimeClass - AddZeros","inputTime":inputTime});
		}
	};

}
