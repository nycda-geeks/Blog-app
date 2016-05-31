var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

var sequelize = new Sequelize('postgres', 'postgres', 12345, {
	host: 'localhost',
	dialect: 'postgres'
});

var User = this.sequelize.define('user' {
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
});

var Post = sequelize.define('post' {
	title: Sequelize.STRING,
	body: Sequelize.TEXT
});

User.hasMany(Post);
Post.belongsTo(User);


var app = express();

app.use(session({
	secret: 'nan nunka lo sa',
	resave: true
}));


app.set('views', './src/views');
app.set('view engine', 'jade');

app.get('/', function (request, response) {
	response.render('index', {
		message: request.query.message,
		user: request.session.user
	});
});

app.get('/profile', function (request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile"));
	} else {
		respone.render('profile', {
			user: user
		});
	}
});

app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please make sure you insert you're email"));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please make sure you insert you're password"));
		return;
	}

	User.fundOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		if (user !== null && request.body.passowrd === user.password) {
			request.session.user = user;
			response.redirect('/profile');
		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});

app.get('/logout', function (request, response) {
	request.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		response.redirect('./?message=' + encodeURIComponent("You have Successfully been logged out."));
	})
});


sequelize.sync({force: true}).then(function () {
	var server = app.listen(3000, function() {
		console.log('app listening on port: ' + server.address().port);
	});
}, function (error) {
	console.log('sync failed: ');
	console.log(error);
});