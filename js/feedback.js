/*!
 * ======================================================
 * FeedBack Template For MUI (http://dev.dcloud.net.cn/mui)
 * =======================================================
 * @version:1.0.0
 * @author:cuihongbao@dcloud.io
 */
(function() {
	var index = 1;
	var size = null;
	var imageIndexIdNum = 0;
	var starIndex = 0;
	var feedback = {
		question: document.getElementById('question'),
		contact: document.getElementById('contact'),
		imageList: document.getElementById('image-list'),
		submitBtn: document.getElementById('submit')
	};
	var url = 'https://service.dcloud.net.cn/feedback';
	feedback.files = [];
	feedback.uploader = null;
	feedback.deviceInfo = null;
	mui.plusReady(function() {
		//设备信息，无需修改
		feedback.deviceInfo = {
			appid: plus.runtime.appid,
			imei: plus.device.imei, //设备标识
			images: feedback.files, //图片文件
			p: mui.os.android ? 'a' : 'i', //平台类型，i表示iOS平台，a表示Android平台。
			md: plus.device.model, //设备型号
			app_version: plus.runtime.version,
			plus_version: plus.runtime.innerVersion, //基座版本号
			os: mui.os.version,
			net: '' + plus.networkinfo.getCurrentType()
		}
	});
	/**
	 *提交成功之后，恢复表单项 
	 */
	feedback.clearForm = function() {
		feedback.question.value = '';
		feedback.contact.value = '';
		feedback.imageList.innerHTML = '';
		feedback.newPlaceholder();
		feedback.files = [];
		index = 0;
		size = 0;
		imageIndexIdNum = 0;
		starIndex = 0;
		//清除所有星标
		mui('.icons i').each(function(index, element) {
			if(element.classList.contains('mui-icon-star-filled')) {
				element.classList.add('mui-icon-star')
				element.classList.remove('mui-icon-star-filled')
			}
		})
	};
	feedback.getFileInputArray = function() {
		return [].slice.call(feedback.imageList.querySelectorAll('.file'));
	};
	feedback.addFile = function(path) {
		feedback.files.push({
			name: "images" + index,
			path: path,
			id: "img-" + index
		});
		index++;
	};
	/**
	 * 初始化图片域占位
	 */
	feedback.newPlaceholder = function() {
		var fileInputArray = feedback.getFileInputArray();
		if(fileInputArray &&
			fileInputArray.length > 0 &&
			fileInputArray[fileInputArray.length - 1].parentNode.classList.contains('space')) {
			return;
		};
		imageIndexIdNum++;
		var placeholder = document.createElement('div');
		placeholder.setAttribute('class', 'image-item space');
		var up = document.createElement("div");
		up.setAttribute('class', 'image-up')
		//删除图片
		var closeButton = document.createElement('div');
		closeButton.setAttribute('class', 'image-close');
		closeButton.innerHTML = 'X';
		closeButton.id = "img-" + index;
		//小X的点击事件
		closeButton.addEventListener('tap', function(event) {
			setTimeout(function() {
				for(var temp = 0; temp < feedback.files.length; temp++) {
					if(feedback.files[temp].id == closeButton.id) {
						feedback.files.splice(temp, 1);
					}
				}
				feedback.imageList.removeChild(placeholder);
			}, 0);
			return false;
		}, false);

		//
		var fileInput = document.createElement('div');
		fileInput.setAttribute('class', 'file');
		fileInput.setAttribute('id', 'image-' + imageIndexIdNum);
		fileInput.addEventListener('tap', function(event) {
			var self = this;
			var index = (this.id).substr(-1);

			plus.gallery.pick(function(e) {
				var name = e.substr(e.lastIndexOf('/') + 1);

				plus.zip.compressImage({
					src: e,
					dst: '_doc/' + name,
					overwrite: true,
					quality: 50
				}, function(zip) {
					size += zip.size;
					if(size > (10 * 1024 * 1024)) {
						return mui.toast('文件超大,请重新选择~');
					}
					if(!self.parentNode.classList.contains('space')) { //已有图片
						feedback.files.splice(index - 1, 1, {
							name: "images" + index,
							path: e
						});
					} else { //加号
						placeholder.classList.remove('space');
						feedback.addFile(zip.target);
						feedback.newPlaceholder();
					}
					up.classList.remove('image-up');
					placeholder.style.backgroundImage = 'url(' + zip.target + ')';
				}, function(zipe) {
					mui.toast('压缩失败！')
				});

			}, function(e) {
				mui.toast(e.message);
			}, {});
		}, false);
		placeholder.appendChild(closeButton);
		placeholder.appendChild(up);
		placeholder.appendChild(fileInput);
		feedback.imageList.appendChild(placeholder);
	};
	feedback.newPlaceholder();
	feedback.submitBtn.addEventListener('tap', function(event) {
		var extras = plus.webview.currentWebview();
		var userId = extras.userId;
		if(!userId) {
			mui.toast('请先登录');
			return;
		}
		if(feedback.question.value == '' ){
			return mui.toast('请填写问题描述');
		}
		if(feedback.question.value == '' ||
			(feedback.contact.value != '' &&
				feedback.contact.value.search(/^(\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+)|([1-9]\d{4,9})$/) != 0)) {
			return mui.toast('信息填写不符合规范');
		}
		if(feedback.question.value.length > 200 || feedback.contact.value.length > 200) {
			return mui.toast('信息超长,请重新填写~')
		}
		if(feedback.contact.value == ''){
			return mui.toast('请填写邮箱');
		}
		//判断网络连接
		if(plus.networkinfo.getCurrentType() == plus.networkinfo.CONNECTION_NONE) {
			return mui.toast("连接网络失败，请稍后再试");
		}

		var param = {
			"jdbcTemplateName": "mysqlTemplate",
			"pFile": "Personal",
			"pKey": "feedback",
			"user_id": userId,
			"propose": feedback.question.value,
			"picture": feedback.files,
			"qqemail": feedback.contact.value,
			"file_directory": "filepath"
		};
		
		feedback.send(param);
	}, false);
	feedback.send = function(content) {
		plus.nativeUI.showWaiting();
		feedback.uploader = plus.uploader.createUpload('http://58.16.181.24:9203/mis-app/Personal/feedback', {
			method: 'POST'
		}, function(upload, status) {
			plus.nativeUI.closeWaiting();
			var res = JSON.parse(upload.responseText);
			//请求完暂未写
			if(res.status == "success") {
				var opener = plus.webview.currentWebview().opener();
				opener.reload();
				plus.webview.currentWebview().close();
			} else {
				console.log(JSON.stringify(res))
				console.error("upload fail");
			}

		});
		//添加上传数据		
		mui.each(content, function(index, element) {
			if(index !== 'picture') {
				feedback.uploader.addData(index, element)
			}
		});
		//添加上传文件
		mui.each(feedback.files, function(index, element) {
			var f = feedback.files[index];
			feedback.uploader.addFile(f.path, {
				key: f.name
			});
		});
		//开始上传任务
		feedback.uploader.start();
	};
	
	document.addEventListener("back", function() {
		feedback.clearForm();
	});

	//选择快捷输入
	mui('.mui-popover').on('tap', 'li', function(e) {
		document.getElementById("question").value = document.getElementById("question").value + this.children[0].innerHTML;
		mui('.mui-popover').popover('toggle')
	})
})();