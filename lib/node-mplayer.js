var cp = require('child_process'),
    events = require('events'),
    fs = require('fs'),
    readline = require('readline2'),
    spawn = cp.spawn;

function Mplayer(path) {
    this.childProc = null;
    this.file = "";
    this.rl = null;

    if (typeof path !== 'undefined')
        this.setFile(path);

    events.EventEmitter.call(this);

    cp.exec('mplayer', function(err, stdout, stdin) {
        if (err)
            throw new Error("Mplayer encountered an error or isn't installed.");
    });
};

Mplayer.prototype.__proto__ = events.EventEmitter.prototype;

Mplayer.prototype.play = function(opts) {
    if (this.file !== null) {
        var args = ['-slave', '-quiet', this.file],
            that = this;

        this.childProc = spawn('mplayer', args);

        if (typeof opts !== 'undefined') {
            if (typeof opts.volume !== 'undefined')
                this.setVolume(opts.volume);

            if (typeof opts.loop !== 'undefined')
                this.setLoop(opts.loop);
        }

        this.childProc.on('error', function(error) {
            console.log(error);
            that.emit('error');
        });

        this.childProc.on('exit', function(code, sig) {
            if (code === 0 && sig === null)
                that.emit('end');
        });

        this.rl = readline.createInterface({
            input: this.childProc.stdout,
            output: this.childProc.stdin
        });
    }
};

Mplayer.prototype.stop = function() {
    if (this.childProc !== null) {
        this.rl.close();
        this.rl = null;
        this.childProc.stdin.write('stop\n');
    }
};

Mplayer.prototype.pause = function() {
    if (this.childProc !== null) {
        this.childProc.stdin.write('pause\n');
    }
};

Mplayer.prototype.mute = function() {
    if (this.childProc !== null) {
        this.childProc.stdin.write('mute\n');
    }
};

Mplayer.prototype.setVolume = function(volume) {
    if (this.childProc !== null) {
        //this.childProc.stdin.write('volume ' + volume + ' 1\n');
        this.childProc.stdin.write('set_property volume ' + volume + '\n');
    }
};

Mplayer.prototype.seek = function(sec) {
    if (this.childProc !== null) {
        //this.childProc.stdin.write('seek ' + sec + ' 2\n');
        this.childProc.stdin.write('set_property time_pos ' + sec + '\n');
    }
};

Mplayer.prototype.setLoop = function(times) {
    if (this.childProc !== null) {
        this.childProc.stdin.write('loop ' + times + '\n');
    }
};

Mplayer.prototype.setSpeed = function(speed) {
    if (this.childProc !== null) {
        this.childProc.stdin.write('speed_set ' + speed + '\n');
    }
};

Mplayer.prototype.setFile = function(path) {
    if (fs.existsSync(path))
        this.file = path;
    else
        throw new Error("File '" + path + "' not found!");
};

Mplayer.prototype.getTimeLength = function(callback) {
    if (this.childProc !== null && this.rl !== null) {
        //this.rl.question("get_time_length\n", function(answer) {
        this.rl.question('get_property length\n', function(answer) {
            callback(answer.split('=')[1]);
        });
    }
};

Mplayer.prototype.getTimePosition = function(callback) {
    if (this.childProc !== null && this.rl !== null) {
        //this.rl.question("get_time_pos\n", function(answer) {
        //callback(0);
        try {
            this.rl.question('get_property time_pos\n', function(answer) {
                callback(answer.split('=')[1]);
            });
        } catch (err) {
            console.log(err);
        }
    }
};

module.exports = Mplayer;
