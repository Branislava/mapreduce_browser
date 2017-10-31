/***************************** REQUIRING MODULES ********************************/
var path = require('path');
var express = require('express'),
    http = require('http');
var multer = require('multer');
var logger = require('morgan');
var app = express();
var bodyParser = require('body-parser');
var fs = require('fs');
var sys = require('util');
var glob = require('glob');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var shortid = require('shortid');
var passwordHash = require('password-hash');
var lineReader = require('line-reader');
var session = require('client-sessions');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var port = process.env.PORT || 3000;
var db = require('./db');
var splitFile = require('split-file');
/***************************** END OF REQUIRING MODULES ********************************/

/***************************** CONST CONFIGURATION **********************************/
/**** flags for tasks ****/
const FRESH = 0;
const FINISHED = 1;
/**** END of flags for tasks ****/

/**** flags for subtasks ****/
const NEWBIE = 1;
const TODDLER = 2;
const NEGLECTED = 3;
const COMPLETED = 4;
/**** END of flags for subtasks ****/

/* maximum allowed time per job execution */
const TIMEOUT = 1 * 60 * 1000;

/* max number of assigned subtasks per help */
const BATCH_SIZE = 1;

/* starting credit */
const STARTING_CREDIT = 100;
/* lower limit */
const LOWER_LIMIT = 50;
/* price for new task */
const TASK_PRICE = -10;
/* gain for new job */
const JOB_GAIN = 5;
/***************************** END OF CONST CONFIGURATION **********************************/

/**************************** SERVER SETUP **********************************/
// views and stuff
app.set('views', 'views');
app.set('view engine', 'ejs');

// Log the requests
app.use(logger('dev'));

// Serve static files
app.use(express.static(path.join(__dirname, 'static')));

// setting data response limitations
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

// storage
uploads_dir = './uploads/';
var storage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, uploads_dir);
    },
    filename: function(req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now());
    }
});
var upload = multer({
    storage: storage
});

// results dir
var results_dir = './results/'

// db collections
var USER = 'user'
var TASK = 'user_task'
var JOB = 'helper_task_job'

// db collections
var user_collection = null;
var task_collection = null;
var job_collection = null;

// authentication configuration and session management
app.use(session({
    cookieName: 'session',
    secret: ('' + new Date().getTime()),
    duration: 12 * 60 * 60 * 1000, // WARNING: 12 hours
    activeDuration: 12 * 60 * 60 * 1000, // WARNING: 12 hours
    httpOnly: true,
    secure: true,
    ephemeral: true
}));
app.use(function(req, res, next) {
    if (req.session && req.session.user) {

        user_collection.findOne({
            email: req.session.user.email
        }).then(function(user) {
            if (user && passwordHash.verify(req.session.user.pswd, user.pswd)) {
                req.user = user;
                delete req.user.password; // delete the password from the session
                req.session.user = user; //refresh the session value
                res.locals.user = user;
            } else
                next();
        });
    } else {
        next();
    }
});
/**************************** END OF SERVER SETUP **********************************/

/***************************** ROUTING SETUP ********************************/
// Login page
app.get('/login', function(req, res) {
    res.render("login.ejs", {
        error: ""
    });
});

// Login page
app.get('/', requireLogin, function(req, res) {
    res.render('home.ejs', {
        user: req.session.user
    });
});

// From somewhere to Home page
app.get('/home', requireLogin, function(req, res) {
    res.render('home.ejs', {
        user: req.session.user
    });
});

// from login form to home page
app.post('/home', function(req, res) {
    // check if user exists
    user_collection.findOne({
        email: req.body.email
    }).then(function(user) {
        if (user && passwordHash.verify(req.body.pswd, user.pswd)) {
            req.session.user = user;
            res.render('home.ejs', {
                user: req.session.user
            });
            console.log('User ' + user.fname + ' logged in.');
        } else
            res.render("login.ejs", {
                error: 'Email or password incorrect.'
            });
    });
});

// From sign up to Home page
app.post('/register', function(req, res) {
    // if email not already registered
    user_collection.findOne({
        email: req.body.email
    }).then(function(user) {
        if (!user) {
            var newUserObj = newUser(req.body);
            user_collection.insertOne(newUserObj);
            req.session.user = newUserObj;
            res.render('home.ejs', {
                user: newUserObj
            });
        } else res.render("login.ejs", {
            error: 'Email already registered.'
        });
    });
});

// Help out page
app.get('/help_out', requireLogin, function(req, res) {

    user_collection.findOne({
        id: req.session.user.id
    }).then(function(user) {
        res.render("help_out.ejs", {
            user: user
        });
    });
});

// Seek help page
app.get('/seek_help', requireLogin, function(req, res) {

    // check if user has enough credit to assign new task
    user_collection.findOne({
        id: req.session.user.id
    }, {
        credit: 1
    }).then(function(user) {
        if (user.credit >= LOWER_LIMIT)
            res.render("seek_help.ejs", {
                user: req.session.user,
                error: ''
            });
        else {
            res.render("error.ejs", {
                    user: req.session.user,
                    error: 'You currently have ' + user.credit + ' credits, \
                            which is not enough to assign new task. \
                            Would you like to help a bit?'
            });
        }
    });


});

// User profile page
app.get('/user_profile', requireLogin, function(req, res) {

    task_collection.find({
            owner_id: req.session.user.id
        }, {
            id: 1,
            desc: 1
        })
        .toArray(function(err, allTasksArray) {

            job_collection.find({
                    helper_id: req.session.user.id
                })
                .toArray(function(err, allJobsArray) {

                    user_collection.findOne({
                        id: req.session.user.id
                    }).then(function(user) {
                        res.render("user_profile.ejs", {
                            user: user,
                            assigned_tasks: allTasksArray,
                            number_of_helped_tasks: allJobsArray.length
                        });
                    })
                });
        });
});

// Preview assigned job status
app.get('/cockpit/:task_id', requireLogin, function(req, res) {

    // first, see if there are neglected jobs
    job_collection.find({
        start_time: {
            $lt: (new Date().getTime() - TIMEOUT)
        },
        status: TODDLER
    }).
    forEach(function(job) {
        job_collection.updateOne({
            id: job.id
        }, {
            $set: {
                status: NEGLECTED,
            }
        });
    });

    // return task
    task_collection.findOne({
        id: req.params.task_id
    }).then(function(task) {
        job_collection.find({
                parent_id: task.id
            }, {
                status: 1,
                start_time: 1,
                end_time: 1
            })
            .toArray(function(err, subtasks) {
                task.subtasks = subtasks;
                res.render("cockpit.ejs", {
                    user: req.session.user,
                    task: task
                });
            });
            
        // check if completed
        if (task.completed_subtasks == task.map_no && task.status != FINISHED) {
            console.log('Task ' + task.id + ' completed!');
            console.log(task.status)

            // update task status
            task_collection.update({
                id: task.id
            }, {
                $set: {
                    status: FINISHED
                }
            });

            // reduce the task
            job_collection.find({
                parent_id: task.id
            }, {
                result: 1
            }).
            toArray(function(err, resArray) {
                // evaluate function
                eval(task.reduce_func);
                // gather all subtasks results
                var results = new Array();
                for (var i = 0; i < resArray.length; i++)
                    results.push(resArray[i].result)
                // invoke it
                var reduced = reduce(results);
                console.log(reduced.data);
                
                // save to external file
                fs.writeFile(results_dir + task.id, JSON.stringify(reduced), function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("The file " + results_dir + task.id + " was saved!");
                });
            });
        }
    });
});

// Return credit for certain user
app.get('/credit/:user_id', requireLogin, function(req, res) {

    user_collection.findOne({
        id: req.params.user_id
    }).then(function(user) {
        res.send({
            credit: user.credit
        });
    });
});

// Preview final results of a task
app.get('/cockpit/results/:task_id', requireLogin, function(req, res) {
    var out_path = results_dir + req.params.task_id;
    fs.readFile(out_path, 'utf8', function(err, data) {
        if (err) {
            return console.log(err);
        }

        res.send(200, data);
    });
});

// Remove task
app.get('/cockpit/remove/:task_id', requireLogin, function(req, res) {
    
    var task_id = req.params.task_id;
    
    // delete jobs per task
    job_collection.remove({parent_id: task_id}, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " task(s) deleted for task #" + task_id);
    });
    
    // delete task
    task_collection.remove({id: task_id}, function(err, obj) {
        if (err) throw err;
        console.log(obj.result.n + " task deleted! #" + task_id);
    });
    
    res.redirect('/user_profile');
});

        

// upload files service
app.post("/upload_files", [upload.any(), requireLogin], function(req, res) {
    
    if (req.files.length == 3 && req.body.desc && req.body.map_no) {

        // get uploaded files
        var map_func_path, reduce_func_path, data_f;
        for (var i = 0; i < req.files.length; i++)
            if (req.files[i].fieldname == 'map_f') map_func_path = req.files[i].path;
            else if (req.files[i].fieldname == 'reduce_f') reduce_func_path = req.files[i].path;
            else if (req.files[i].fieldname == 'data_f') data_f = req.files[i].filename;

        /* dividing data into n chunks of equal size */
        var fullpath = uploads_dir + data_f;
        var map_no = parseInt(req.body.map_no);

        splitFile.splitFile(fullpath, map_no)
            .then((names) => {
                console.log(names);
                
                // creating new task object
                var task = newTask(req.session.user.id, req.body.desc, names, map_func_path, reduce_func_path);

                // inserting jobs into db
                job_collection.insertMany(task.subtasks);

                // inserting task itself into db
                delete task.subtasks;
                task_collection.insertOne(task);

                // decreasing credit for this user
                user_collection.updateOne({
                    id: task.owner_id
                }, {
                    $inc: {
                        credit: TASK_PRICE
                    }
                });

                res.redirect("/cockpit/" + task.id);
                
            })
            .catch((err) => {
                console.log('Error: ', err);
            });
        
    } else {
        res.render("seek_help.ejs", {
            user: req.session.user,
            error: 'Please, upload all needed files!'
        });
    }
});

app.get('/logout', requireLogin, function(req, res) {
    req.session.reset();
    res.redirect('/login');
});

// Route for everything else
app.get('*', function(req, res) {
    res.render("error.ejs", {
        user: req.session.user,
        error: '(404) Sorry, the page you were looking was not found.'
    });
});
/***************************** END OF ROUTING SETUP ********************************/

/***************************** SOCKETS DEPARTMENT *********************************/
io.on('connection', function(socket) {

    // remembering user's session
    socket.on('helper_joined', function(user) {
        socket.user = user;
        console.log('helper ' + user.email + ' in the house');
    });

    socket.on('subtask_request', function() {

        // first, see if there are neglected jobs
        job_collection.find({
            start_time: {
                $lt: (new Date().getTime() - TIMEOUT)
            },
            status: TODDLER
        }).
        forEach(function(job) {
            
            console.log(job.id + ' neglected');
            
            job_collection.updateOne({
                id: job.id
            }, {
                $set: {
                    status: NEGLECTED,
                }
            });
        });

        // assigning them tasks that haven't been yet undertaken
        job_collection.find({
                status: {
                    $in: [NEWBIE, NEGLECTED]
                }
            })
            .limit(BATCH_SIZE)
            .toArray(function(err, resArray) {
                // emit jobs
                socket.emit('assign_jobs', resArray);
                
                for (var i = 0; i < resArray.length; i++) {
                    // and now update jobs' status
                    job_collection.updateOne({
                        id: resArray[i].id
                    }, {
                        $set: {
                            status: TODDLER,
                            start_time: (new Date()).getTime()
                        }
                    });
                }
            });
    });

    // client asks for task
    socket.on('subtask_finished', function(response) {

        // update job status
        job_collection.update({
            id: response.subtask_id
        }, {
            $set: {
                status: COMPLETED,
                end_time: (new Date()).getTime(),
                result: response.result
            }
        });

        // update task (increment number of completed jobs per task)
        task_collection.update({
            id: response.task_id
        }, {
            $inc: {
                completed_subtasks: 1
            }
        });

        // increase credit for this user
        user_collection.update({
            id: response.user_id
        }, {
            $inc: {
                credit: JOB_GAIN
            }
        });
        
        console.log('finished job ' + response.subtask_id);
    });
});
/***************************** END OF SOCKETS DEPARTMENT *************************/

/***************************** VARIOUS DATA TYPES AND FUNCTIONS ******************************/
/* fresh task object */
function newTask(owner_id, desc, subtasks, map_func_path, reduce_func_path) {
    var task_id = shortid.generate();
    var reduce_func = fs.readFileSync(reduce_func_path, 'utf8');
    var o = {
        id: task_id,
        owner_id: owner_id,
        status: FRESH,
        desc: desc,
        map_no: subtasks.length,
        subtasks: new Array(),
        completed_subtasks: 0,
        map_func_path: map_func_path,
        reduce_func: reduce_func,
    };
    for (var i = 0; i < o.map_no; i++)
        o.subtasks.push(newJob(subtasks[i], map_func_path, task_id));
    return o;
}
/* newbie subtask object */
function newJob(data_path, map_func_path, parent_id) {
    var data = fs.readFileSync(data_path, 'utf8');
    var map_func = fs.readFileSync(map_func_path, 'utf8');
    return {
        id: shortid.generate(),
        helper_id: -1,
        parent_id: parent_id,
        status: NEWBIE,
        start_time: -1,
        end_time: -1,
        data: data,
        map_func: map_func,
        result: ''
    };
}
/* create new task object */
function newUser(r) {
    id = shortid.generate();
    var pswd = passwordHash.generate(r.pswd);
    return {
        id: id,
        fname: r.fname,
        lname: r.lname,
        email: r.email,
        pswd: pswd,
        credit: STARTING_CREDIT
    };
}
/* callback function to check if user logged in */
function requireLogin(req, res, next) {
    if (!req.session.user && !req.user) res.redirect('/login');
    else next();
}
/***************************** END OF VARIOUS DATA TYPES AND FUNCTIONS ******************************/
// Fire it up & Connect to Mongo on start
db.connect('mongodb://localhost:27017/multitasking', function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {
        server.listen(port);
        
        user_collection = db.get().collection(USER);
        task_collection = db.get().collection(TASK);
        job_collection = db.get().collection(JOB);

        console.log('Start listening at port %d...', port)
    }
})
