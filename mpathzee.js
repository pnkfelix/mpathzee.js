function reset_mpath(mp) {
    mp.initial_point = pt_to_xy([0,0]);
    mp.current_point = pt_to_xy([0,0]);
    mp.current_data = "M 0,0";
    mp.current_attrs = {};
}

function MPath(s) {
    reset_mpath(this)
    this.snap_svg = s;
    this.paths = [];
    this.nodes = [];
}

MPath.prototype.reset = function () {
    reset_mpath(this);
    return this;
};

MPath.prototype.reset_attrs = function () {
    this.current_attrs = {};
};

MPath.prototype.node = function(f) {
    var saved_point = {x:this.current_point.x,
                       y:this.current_point.y};
    this.nodes.push([saved_point, f]);
    return this;
};

(function () {
    var attrs = ["stroke", "strokeWidth", "strokeOpacity"];
    for (i in attrs) {
        (function () {
            var attr = attrs[i];
            MPath.prototype[attr] = function(val) {
                this.current_attrs[attr] = val;
                return this;
            }
        })()
    }
})();

MPath.prototype_variants = function(abs_cmds, rel_cmds, cmd_to_f) {
    for (var i in abs_cmds) {
        (function () {
            var key = abs_cmds[i];
            // console.log("adding abs '"+key+"'");
            MPath.prototype[key] =
                cmd_to_f(key,
                         function (xy) {
                             // console.log("calling abs update for '"+key+"'" + JSON.stringify(this));
                             this.current_point.x = xy.x;
                             this.current_point.y = xy.y;
                             return this;
                         });
        })();
    }
    for (var i in rel_cmds) {
        (function () {
            var key = rel_cmds[i];
            // console.log("adding rel '"+key+"'");
            MPath.prototype[key] =
                cmd_to_f(key,
                         function (d) {
                             // console.log("calling rel update for '"+key+"'");
                             this.current_point.x += d.x;
                             this.current_point.y += d.y;
                             return this;
                         });
        })();
    }
};

function die(msg) { throw new Error(msg); }

function pt_to_xy(p) {
    // console.log("calling pt_to_xy for "+JSON.stringify(p));
    var x = p.hasOwnProperty("x") ? p["x"]
        :   p.hasOwnProperty(0)   ? p[0]
        :   die("no x found in "+JSON.stringify(p));
    var y = p.hasOwnProperty("y") ? p["y"]
        :   p.hasOwnProperty(1)   ? p[1]
        :   die("no y found in "+JSON.stringify(p));
    return {x:x, y:y};
}

MPath.prototype_variants(
    ["M", "L", "T"],
    ["m", "l", "t"],
    function (cmd, update) {
        // console.log("building method for '"+cmd+"'");
        return function (p) {
            // console.log("calling built method for '"+cmd+"' on "+JSON.stringify(p));
            var xy = pt_to_xy(p);
            this.current_data +=
                Snap.format(" {cmd} {x},{y}", {cmd: cmd, x:xy.x, y:xy.y});
            return update.call(this, xy);
        };
    });

MPath.prototype_variants(["H"], ["h"], function (cmd, update) {
    return function (x) {
        this.current_data +=
            Snap.format(" {cmd} {x}", {cmd: cmd, x:x});
        return update.call(this, {x: x, y: cmd == "H" ? this.current_point.y : 0});
    };
});

MPath.prototype_variants(["V"], ["v"], function (cmd, update) {
    return function (y) {
        this.current_data +=
            Snap.format(" {cmd} {y}", {cmd: cmd, y:y});
        return update.call(this, {x: cmd == "V" ? this.current_point.x : 0, y: y});
    };
});

MPath.prototype_variants(["A"], ["a"], function (cmd, update) {
    return function (rx, ry, xar, fl, fs, p) {
        var xy = pt_to_xy(p);
        this.current_data +=
            Snap.format(" {cmd} {rx},{ry} {xar} {fl} {fs} {x},{y}",
                        {cmd:cmd, rx:rx, ry:ry, xar:xar, fl:fl, fs:fs,
                         x:xy.x, y:xy.y});
        return update.call(this, xy);
    }
});

MPath.prototype_variants(["Q","S"], ["q","s"], function (cmd, update) {
    return function (c, p) {
        var cxy = pt_to_xy(c);
        var xy = pt_to_xy(p);
        this.current_data +=
            Snap.format(" {cmd} {cx},{cy} {x},{y}",
                        {cmd:cmd, cx:cxy.x, cy:cxy.y,
                         x:xy.x, y:xy.y});
        return update.call(this, xy);
    }
});
// t,T: handled above

MPath.prototype_variants(["C"], ["c"], function (cmd, update) {
    return function (c1, c2, p) {
        // console.log("Calling impl for '"+cmd+"'");
        var c1xy = pt_to_xy(c1);
        var c2xy = pt_to_xy(c2);
        var xy = pt_to_xy(p);
        var add = 
            Snap.format(" {cmd} {c1_x},{c1_y} {c2_x},{c2_y} {x},{y}",
                        {cmd:cmd, c1_x:c1xy.x, c1_y:c1xy.y,
                         c2_x:c2xy.x, c2_y:c2xy.y,
                         x:xy.x, y:xy.y});
        // console.log("Calling impl for '"+cmd+"("+JSON.stringify([c1xy,c2xy,xy])+")' adds '"+add+"'");
        this.current_data += add;
        return update.call(this, xy);
    };
});
// s,T: handled above

MPath.prototype_variants(["z", "Z"], [], function (cmd, update) {
    return function () {
        this.current_data += Snap.format(" {cmd}");
        return update.call(this, this.initial_point);
    };
});

MPath.prototype.path = function () {
    var p = this.snap_svg.path(this.current_data);
    p.attr(this.current_attrs);
    this.paths.push(p);
    this.initial_point = { x: this.current_point.x, y: this.current_point.y };
    this.current_data = "M " + this.current_point.x + "," + this.current_point.y;
    return this;
}

MPath.prototype.finish = function () {
    this.path();
    var nodes = [];
    for (i in this.nodes) {
        var node_pt = this.nodes[i][0];
        var node_f = this.nodes[i][1];
        nodes.push(node_f(node_pt));
    }
    var s = this.snap_svg;
    var paths = s.group.apply(s, this.paths);
    var built_nodes = s.group.apply(s, nodes);
    return s.group(paths, built_nodes);
}
