const User = require('./models/user');
module.exports = function(app, passport) {

const mongoose = require('mongoose');
const classSchema = {
    classname: String,
    description: String,
    createdby: String,
    forBatch: String
}; 
const ClassDetail = mongoose.model("Class", classSchema);

const postSchema = {
    postfromclass: String,
    title: String,
    content: String
  };
const Post = mongoose.model("Post", postSchema);

const facultySchema = {
    email: String
};
const Faculty = mongoose.model("Faculty", facultySchema);

const studentSchema = {
    email: String,
    batch: String
};
const Student = mongoose.model("Student", studentSchema);

const SubmissionSchema = {
    postId: String,
    rollno: String,
    submissionlink: String
  };
const Submission = mongoose.model("Submission", SubmissionSchema);
  

// normal routes ===============================================================
    // show the home page 
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        let email;
        if(req.user.google.email === undefined){
            email=req.user.local.email;
        }
        else{
            email = req.user.google.email;    
        }
                
        let usertype = "faculty";
        
        Faculty.findOne({email: email},function(err,faculty){
            console.log(faculty);
            if(faculty !== null){
                console.log("Is faculty");
                ClassDetail.find({createdby: email}, function(err, classes){
                    res.render("class_"+usertype, {
                        classes: classes,                    
                    });
                });
            }
            else{

                Student.findOne({email: email},function(err,student){
                    //console.log(student.batch);
                    if(student !== null){
                        console.log("Is student");
                        usertype= "student";
                        ClassDetail.find({forBatch: student.batch}, function(err, classes){
                            res.render("class_"+usertype, {
                                classes: classes,                    
                            });
                        });
                    }
                    else{
                        res.redirect("/logoutinvaliduser");
                    }
                })
            }
        })
        
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/logoutinvaliduser', function(req, res) {
    
        let email;
        if(req.user.google.email === undefined){
            email=req.user.local.email;
            User.deleteOne({"local.email": email},function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("deleted succesfully");
                }
            })
        }
        else{
            email = req.user.google.email;
            User.deleteOne({"google.email": email},function(err){
                if(err){
                    console.log(err);
                }
                else{
                    console.log("deleted succesfully google");
                }
            })
        }
        req.logout();
        res.render("invaliduser");
    });

    app.get("/addclass",isLoggedIn, function(req, res){
        let email;
        if(req.user.google.email === undefined){
            email=req.user.local.email;
        }
        else{
            email = req.user.google.email;    
        }
        
        res.render("addclass",{
            createdby: email
        });
      });

    app.post("/addclass", function(req, res){
      const classdetail = new ClassDetail({
        classname: req.body.classTitle,
        description: req.body.classDescription,
        forBatch: req.body.forBatch,
        createdby: req.body.createdby
      });
    
      classdetail.save(function(err){
        if (!err){
            res.redirect("/profile");
        }
      });
    });

    app.post("/classes/:singleclassId", function(req, res){
    
        const requestedclassId = req.params.singleclassId;
        const usertype = req.body.usertype;
        
        Post.find({postfromclass: requestedclassId}, function(err, posts){
          
        if(err) {
          console.log(err);
        } else{  
          res.render("home_"+usertype, {
            posts: posts,
            singleclassId: requestedclassId
          });
        }
        });
    });

    app.post("/addposts", function(req, res){
        const singleclassId = req.body.singleclassId;
        
        res.render("addposts",{
          singleclassId: singleclassId
        });
          
      });

    app.post("/compose", function(req, res){
      const singleclassId = req.body.singleclassId;
      const post = new Post({
        title: req.body.postTitle,
        content: req.body.postBody,
        postfromclass: req.body.singleclassId
      });
    
      post.save(function(err){
        if (!err){
    
          Post.find({postfromclass: singleclassId}, function(err, posts){
            res.render("home_faculty", {
              posts: posts,
              singleclassId: singleclassId
            });
          });
        }
      });
    });

    app.post("/posts/:postId", function(req, res){
    
        const requestedPostId = req.params.postId;
        const usertype = req.body.usertype;
        const singleclassId = req.body.singleclassId;
    
        Post.findOne({_id: requestedPostId}, function(err, post){
          res.render("post_"+usertype, {
            title: post.title,
            content: post.content,
            postId: requestedPostId,
            singleclassId: singleclassId
          });
        });
    
    });
      
    app.post("/viewsubmissions", function(req, res){
        const PostIdsubmissions = req.body.postId;
        Submission.find({postId: PostIdsubmissions}, function(err, submissions){
            res.render("view_submissions", {
              submissions: submissions
              
            });
          });    
      });
      
    app.post("/submission", function(req, res){

      const singleclassId = req.body.singleclassId;
      console.log(req.body.singleclassId);
    
      const submission = new Submission({
        postId: req.body.postId,
        rollno: req.body.rollno,
        submissionlink: req.body.submission
      });
    
      submission.save(function(err){
        if (!err){
            Post.find({postfromclass: singleclassId}, function(err, posts){
              if(err) {
                console.log(err);
              } else {
                res.render("home_student", {
                singleclassId: singleclassId,
                posts: posts
                });
              }
            });  
        }
      });  
    });
    
    // show the login form
    app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // show the signup form
    app.get('/signup', function(req, res) {
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // google
    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
