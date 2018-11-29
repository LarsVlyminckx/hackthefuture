sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/List',
	'sap/m/StandardListItem'
], function (Controller, MessageBox, JSONModel, Button, Dialog, List, StandardListItem) {
	"use strict";

	return Controller.extend("com.flexso.HackTheFuture.controller.Main", {

		onInit: function () {

		},

		getIotData: function () {
			var me = this;
			// url to get the artifact signals of your device : 
			var promise = new Promise(function (resolve, reject) {
					$.ajax({
						type: "GET",
						url: "/devices/108/measures",
						headers: "",
						success: function (data) {
							resolve(me.groupData(data));
						},
						error: function (Error) {
							reject((Error));
						},
						contentType: false,
						async: true,
						data: null,
						cache: false,
						processData: false
					});
				})
				.then(
					function (value) {
						var oModel = new JSONModel();
						oModel.loadData(value);
						me.getView().setModel(oModel, "dataModel");
						//console.log(value);
					}
					//-> XX = your device id
				);
		},

		groupData: function (data) {
			var dataarray = [];
			var i = 0;
			var j = 0;
			var o = "";
			for (var i=0; i < data.length; i = i + 4) {
				o += "{artifact_id: " + data[i].measure.artifact_id + ", longitude: " + data[i + 1].measure.longitude + ", latitude: " + data[i + 2].measure.latitude + ", artifact_signal: " + data[i + 3].measure.artifact_signal + "}";
				dataarray[j] = o;
				j++;
			}
			return dataarray;

		},

		triggerML: function (oEvent) {},

		getMlAuthToken: function () {
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/token?grant_type=client_credentials",
					headers: "",
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});

			return Promise.resolve(promise).then(function (result) {
				return "Bearer " + result.access_token;
			});
		},

		sendToMl: function () {

			//Use the following format to send to ML (image name can always be 'ArtifactSignal.jpg')
			//image is a variable
			//var formData = new FormData();
			//formData.append("files", image, "ArtifactSignal.jpg");

			//url to post on : '/ml-dest/api/v2/image/classification/models/HTF/versions/2'

		},

		base64toBlob: function (b64Data, contentType, sliceSize) {

			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {
				type: contentType
			});
			return blob;
		}

	});
});