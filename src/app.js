var Sequelize = require('sequelize');
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');
var pg = require('pg');

var sequelize = new Sequelize('postgres', 'postgres', 12345, {
	host: 'localhost',
	dialect: 'postgres'
});

var User = sequelize.define('user', {
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
});

var Post = sequelize.define('post', {
	title: Sequelize.STRING,
	body: Sequelize.TEXT,
	userID: Sequelize.INTEGER,
	author: Sequelize.TEXT
});

var Comments = sequelize.define('comments', {
	message: Sequelize.TEXT,
	messageId: Sequelize.INTEGER,
	author: Sequelize.TEXT
});

User.hasMany(Post);
Post.belongsTo(User);
Post.hasMany(Comments);
Comments.belongsTo(User);
Comments.belongsTo(Post);
User.hasMany(Comments);


var app = express();

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(session({
	secret: 'nan nunka lo sa',
	resave: true,
	saveUninitialized: false
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
		response.render('profile', {
			user: user
		});
	}
});

app.get('/users', function (request, response) {
	User.findAll().then(function (users) {
		users = users.map(function (userRow) {
			var columns = userRow.dataValues;
			return {
				id: columns.id,
				name: columns.name,
				email: columns.email
			}
		});

		response.render('users', {
			users: users
		});
	});
});

app.get('/posts', function (request, response) {
	Post.findAll().then(function (posts) {
		posts = posts.map(function (postRow) {
			var columns = postRow.dataValues;
			return {
				id: columns.id,
				title: columns.title,
				body: columns.body
			}
		});
		response.render('posts', {
			posts: posts
		});
	});
});

app.get('/myposts', function (req, res) {
	User.findOne({
		where: {
			id: req.session.user.id
		}
	}).then(function(theuser){
		theuser.getPosts().then(function(theposts){
			console.log(theposts)
			console.log("e no ta wordu husa")
			res.render('myposts', {
				posts: theposts
			});
		});
	});
});


app.get('/register', function (req, res){
	res.render('register')
});

app.post('/register', function (req, res) {
	User.create({
		name: req.body.name,
		email: req.body.email,
		password: req.body.password
	});
	res.redirect('/')
});


app.post('/profile', function (req, res) {
	User.findOne({
		where: {
			id: req.session.user.id
		}
	}).then(function(theuser){
		theuser.createPost({
			title: req.body.title,
			body: req.body.body,
			author: req.session.user.name	
		});
	});
	res.redirect('/posts')
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

	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		if (user !== null && request.body.password === user.password) {
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

app.get('/posts/single', function(request, response) {
	response.render('single');
});



app.get('/posts/single/:id', function(request, response) {
	var user = request.session.user;
	messageID = request.params.id;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {
		console.log(request.params.id);
		Post.findById(request.params.id).then(function(apple) { // this specifies the columns in my messages table
			console.log("Finding all messages at /post");
			// console.log(apple);

			var single = {
				id: apple.dataValues.id,
				title: apple.dataValues.title,
				body: apple.dataValues.body,
				author: apple.dataValues.author
			}
			console.log("being used");

			console.log(single);



			Comments.findAll({
				where: {
					messageId: request.params.id
				}
			}).then(function(apple) { // this specifies the columns in my messages table
				console.log("Finding all comments at /comments");
				// console.log(apple);

				var finding = apple.map(function(comment) {
					return {
						author: request.session.user.name,
						message: comment.dataValues.message
					};
				});


			// 	console.log("printing results:");
				console.log(user);

				response.render('single', {
					 finding: finding,
					posts: single
				});
			});
		})
	}
});

app.post('/posts/addcomment', function (request, response) {
// console.log(request.params.id);
	console.log("tesytest");
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your posts."));
	} else {
				// console.log(user);
			var email = user.email;
			var comment = request.body.comment;
			//var messageId= request.params.id;
			console.log(request.session.user.name);

			Comments.create({
 
				message: comment,
				author: request.session.user.name,
				messageId: messageID

			});

			console.log("post request received");
			console.log(request.body);
			// response.send("i hear u");
		response.redirect('back'); // back says: stay on this page
		}
	});



sequelize.sync({force: true}).then(function () {
	User.create({
		name: "anthony",
		email: "anthony_wever@yahoo.com",
		password: "password"
	}).then(function () {
		var server = app.listen(3000, function() {
			console.log('app listening on port: ' + server.address().port);
		});
	});
}, function (error) {
	console.log('sync failed: ');
	console.log(error);
});
