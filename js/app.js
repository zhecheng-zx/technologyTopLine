(function($, owner) {
	/**
	 * 用户登录
	 **/
	owner.login = function(loginInfo, callback) {
		callback = callback || $.noop;
		loginInfo = loginInfo || {};
		loginInfo.phone = loginInfo.phone || '';
		loginInfo.password = loginInfo.password || '';
		
		if(loginInfo.phone.length <= 0) {
			return callback('手机号不能为空');
		}
		if(loginInfo.password.length <= 0) {
			return callback('密码不能为空');
		}

		plus.nativeUI.showWaiting('努力登录中');
		mui.ajax('http://58.16.181.24:9203/mis-app/public/toLogin', {
			data: loginInfo,
			success: function(result) {
				if(result.status != 0) {
					return callback(result.msg);
				} else {
					return owner.createState(result.data, callback);
				}
			},
			error: function(xhr, type, errorThrown) {
				console.error(JSON.stringify(xhr));
				console.error(type);
				return callback(type);
			}
		});
	};

	owner.createState = function(userInfo, callback) {
		var state = owner.getState();
		state.userId = userInfo.id;
		state.account = userInfo.userName;
		state.phone = userInfo.phone;
		state.personImages = userInfo.personImages;
		state.userIntroduced = userInfo.userIntroduced;
		owner.setState(state);
		return callback();
	};

	/**
	 * 获取当前状态
	 **/
	owner.getState = function() {
		var stateText = localStorage.getItem('$state') || "{}";
		return JSON.parse(stateText);
	};

	/**
	 * 设置当前状态
	 **/
	owner.setState = function(state) {
		state = state || {};
		try {
			localStorage.clear('$state');
			localStorage.setItem('$state', JSON.stringify(state));
		} catch(e) {
			//TODO handle the exception
			console.error(e);
		}
	};

	/**
	 * 找回密码
	 **/
	owner.forgetPassword = function(email, callback) {
		callback = callback || $.noop;
		if(!checkEmail(email)) {
			return callback('邮箱地址不合法');
		}
		return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
	};

	/**
	 * 设置应用本地配置  暂未用到
	 **/
	owner.setSettings = function(settings) {
		settings = settings || {};
		localStorage.setItem('$settings', JSON.stringify(settings));
	}

	/**
	 * 获取应用本地配置 暂未用到
	 **/
	owner.getSettings = function() {
		var settingsText = localStorage.getItem('$settings') || "{}";
		return JSON.parse(settingsText);
	}
	
	/**
	 * 获取本地是否安装客户端
	 **/
	owner.isInstalled = function(id) {
		if(id === 'qihoo' && mui.os.plus) {
			return true;
		}
		if(mui.os.android) {
			var main = plus.android.runtimeMainActivity();
			var packageManager = main.getPackageManager();
			var PackageManager = plus.android.importClass(packageManager)
			var packageName = {
				"qq": "com.tencent.mobileqq",
				"weixin": "com.tencent.mm",
				"sinaweibo": "com.sina.weibo"
			}
			try {
				return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
			} catch(e) {}
		} else {
			switch(id) {
				case "qq":
					var TencentOAuth = plus.ios.import("TencentOAuth");
					return TencentOAuth.iphoneQQInstalled();
				case "weixin":
					var WXApi = plus.ios.import("WXApi");
					return WXApi.isWXAppInstalled()
				case "sinaweibo":
					var SinaAPI = plus.ios.import("WeiboSDK");
					return SinaAPI.isWeiboAppInstalled()
				default:
					break;
			}
		}
	}
}(mui, window.app = {}));