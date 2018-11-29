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
						console.log(value);
						var oModel = new JSONModel();
						oModel.setData({
							"array": value
						});
						me.getView().setModel(oModel, "dataModel");
						//console.log(value);
					}
					//-> XX = your device id
				);
		},

		groupData: function (data) {
			var me = this;
			var dataarray = [];
			var i = 0;
			var j = 0;
			var o;
			for (var i = 0; i < data.length; i = i + 4) {

				o = {
					"artifact_id": data[i].measure.artifact_id,
					"longitude": data[i + 1].measure.longitude,
					"latitude": data[i + 2].measure.latitude,
					"artifact_signal": URL.createObjectURL(me.base64toBlob(data[i + 3].measure.artifact_signal)),
					"artifact_signal_base": data[i + 3].measure.artifact_signal
				};

				//o += "{'artifact_id': '" + data[i].measure.artifact_id + "', 'longitude': '" + data[i + 1].measure.longitude + "', 'latitude': '" + data[i + 2].measure.latitude + "', 'artifact_signal': '" + data[i + 3].measure.artifact_signal + "'}";
				console.log(o);
				dataarray[j] = o;
				j++;
				o = null;
			}
			return dataarray;

		},

		triggerML: function (oEvent) {
			var me = this;

			var lol = oEvent.getSource().getCustomData()[0].getProperty('value');
			
			me.getMlAuthToken().then(function(token) {
				me.sendToMl(token, lol).then(function(result) {
					console.log(result.result.predictions[0].results[0].label);
					//var pressDialog = null;
                    var model = new JSONModel(result.result);
                    var pressDialog = new Dialog({
                        title: 'Machine Learning Results',
                        content: new List({
                            items: {
                                path: '/predictions/0/results',
                                template: new StandardListItem({
                                    title: "{label}",
                                    description: "{score}"
                                })
                            }
                        }),
                        subHeader: new sap.m.Bar({
                            contentMiddle: [new sap.m.Image({
                                src: result.image
                            })]
                        }),
                        beginButton: new Button({
                            text: 'Close',
                            press: function () {
                                pressDialog.destroy();
                            }
                        })
                    });
                    
                    
                    //to get access to the global model
                    me.getView().addDependent(me.pressDialog);
                    
                    pressDialog.setModel(model);
                    pressDialog.open();
				});
			});
		},

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

		sendToMl: function (token, base64) {
            var contentType = 'image/jpg';
            var image = this.base64toBlob(base64, contentType);
            var blobUrl = URL.createObjectURL(image);
            var formData = new FormData();
            formData.append("files", image, "ArtifactSignal.jpg");
            var promise = new Promise(function (resolve, reject) {
                $.ajax({
                    type: "POST",
                    url: "/ml-dest/api/v2/image/classification/models/HTF/versions/2",
                    headers: {
                        "Accept": "application/json",
                        "APIKey": token,
                        "Authorization": token
                    },
                    success: function (data) {
                        resolve(data);
                    },
                    error: function (Error) {
                        reject((Error));
                    },
                    contentType: false,
                    async: false,
                    data: formData,
                    cache: false,
                    processData: false
                });
            });
            return Promise.resolve(promise).then(function (result) {
                var obj = {
                    "result": result,
                    "image": blobUrl
                };
                return obj;
            });
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