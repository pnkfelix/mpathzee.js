var dev_color = "red";
function grid_pat(s) {
    var ten = s.path("M 0,0 v10 h10").attr({ fill: "none", stroke: "#aaaaaa", strokeWidth: 1 });
    var hundred = s.path("M 0,0 v 100 h 100 v -100 Z");
    hundred.attr({ stroke: "#555555", strokeWidth: 1 });
    hundred.attr({ fill: ten.pattern(0, 0, 10, 10) });
    return hundred.pattern(0, 0, 100, 100);
}
Snap.plugin(function(Snap,Element,Paper,global) {
    function make_drag_start(f) {
        return function(x,y,evt) {
            var p1 = this.paper.node.createSVGPoint();
            p1.x = evt.clientX;
            p1.y = evt.clientY;
            var screen_to_global = this.paper.node.getScreenCTM().inverse();
            var p3 = p1.matrixTransform(screen_to_global);
            f.call(this, p3.x, p3.y, evt);
        };
    }
    function make_drag_move(f) {
        return function (dx, dy, x, y, evt) {
            var p1 = this.paper.node.createSVGPoint();
            p1.x = evt.clientX;
            p1.y = evt.clientY;
            var screen_to_global = this.paper.node.getScreenCTM().inverse();
            var p3 = p1.matrixTransform(screen_to_global);
            p1.x = dx;
            p1.y = dy;
            var dp = p1.matrixTransform(screen_to_global);
            f.call(this, dp.x, dp.y, p3.x, p3.y, evt);
        };
    }
    function make_drag_end(f) {
        return function(evt) {
            f.call(this, evt);
        };
    }
    Element.prototype.altDrag = function(dm, ds, de, cm, cs, ce) {
        this.drag(make_drag_move(dm), make_drag_start(ds), make_drag_end(de),
                  cm, cs, ce);
        return this;
    };
});
