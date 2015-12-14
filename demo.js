function build_neg16() {
    var s = Snap("#demo_neg16");
    s.rect(0, 0, "100%", "100%").attr({ fill: grid_pat(s) });
    var svg = document.getElementById("demo_neg16");
    var g = (new MPath(s))
        .strokeWidth(5)
        .strokeOpacity(0.6)
        .m([10,10])
        .L([300,30])
        .node(function (p) { return s.circle(310, 30, 20) })
        .q([110,100], [30,30])
        .stroke("blue")
        .path()
        .m([10,10])
        .node(function (p) { return s.circle(p.x, p.y, 18).attr({fill: "orange", opacity: 0.5, stroke: "red" }); })
        .m([-10,10])
        .l([-160,70])
        .stroke("green")
        .finish();
    var hi = document.getElementById("hi_textarea");
    hi.appendChild(document.createTextNode(JSON.stringify(g)));
}

function build_neg15() {
    var s = Snap("#demo_neg15");
    var svg = document.getElementById("demo_neg15");
    s.rect(0, 0, "100%", "100%").attr({ fill: grid_pat(s) });

    var model = {
        start: { x: 10, y:190 },
        ctrl: [{ x:390, y:190 }, { x: 10, y: 10 }],
        finis: { x:210, y: 90 },
    };

    var e1 = s.ellipse(100, 100, 75, 50)
        .attr({stroke: "green", fill: dev_color, fillOpacity: 0.2});

    var e2 = s.ellipse(300, 100, 75, 50)
        .attr({stroke: "purple", fill: dev_color, fillOpacity: 0.2});

    var p = s.path().attr({stroke: "blue", fill: "none" });
    var cs = s.circle(0,0,5).attr({stroke:"blue", fill:dev_color});
    var cf = s.circle(0,0,5).attr({stroke:"blue", fill:dev_color});
    var c1 = s.circle(0,0,5).attr({stroke:"orange", fill:dev_color});
    var c2 = s.circle(0,0,5).attr({stroke:"orange", fill:dev_color});
    var l1 = s.line().attr({stroke: "orange", opacity: 0.5});
    var l2 = s.line().attr({stroke: "orange", opacity: 0.5});

    var update_shapes = (function() {
        // Make local copies of the instances built above so that
        // other script blocks' choice of variable names won't change
        // the behavior of the callback below.

        // All coordinates zeroed here get filled in by closure below each
        // time it is called (and we call it once immediately after
        // building it); this way has just one point of control for
        // positioning relationships.)
        var my_p = p;
        var my_cs = cs;
        var my_cf = cf;
        var my_c1 = c1;
        var my_c2 = c2;
        var my_l1 = l1;
        var my_l2 = l2;
        var my_model = model;

        function make_path_d() {
            // console.log("my_model: "+JSON.stringify(my_model));
            return (new MPath())
                .M(my_model.start)
                .C(my_model.ctrl[0], my_model.ctrl[1], my_model.finis)
                .current_data;
        }

        return function update_shapes() {
            my_cs.attr({cx: my_model.start.x, cy: my_model.start.y});
            my_cf.attr({cx: my_model.finis.x, cy: my_model.finis.y});
            my_c1.attr({cx: my_model.ctrl[0].x, cy: my_model.ctrl[0].y});
            my_c2.attr({cx: my_model.ctrl[1].x, cy: my_model.ctrl[1].y});
            my_l1.attr({x1: my_model.start.x, y1: my_model.start.y,
                        x2: my_model.ctrl[0].x, y2: my_model.ctrl[0].y});
            my_l2.attr({x1: my_model.finis.x, y1: my_model.finis.y,
                        x2: my_model.ctrl[1].x, y2: my_model.ctrl[1].y});
            my_p.attr({d: make_path_d()});
        }
    })();

    update_shapes();

    var make_drag_move = (function() {
        var my_update_shapes = update_shapes;
        return function(model_part) {
            return function(dx, dy, x, y, evt) {
                model_part.x = x; model_part.y = y; my_update_shapes();
            };
        };
    })();

    cs.altDrag(make_drag_move(model.start), function(x,y,e) {}, function(e) {});
    cf.altDrag(make_drag_move(model.finis), function(x,y,e) {}, function(e) {});
    c1.altDrag(make_drag_move(model.ctrl[0]), function(x,y,e2) {}, function(e) {});
    c2.altDrag(make_drag_move(model.ctrl[1]), function(x,y,e) {}, function(e) {});

    function make_ellipse_draggable(e) {
        var my_e = e;
        var dcx;
        var dcy;
        e.altDrag(function(dx, dy, x, y, evt) { true;// console.log("got here x:"+x+" y:"+y);
                                                my_e.attr({cx:x - dcx, cy:y - dcy});
                                              },
                  function(x, y, evt) {
                      dcx = x - my_e.attr("cx");
                      dcy = y - my_e.attr("cy");
                  },
                  function(evt) { });
    }
    make_ellipse_draggable(e1);
    make_ellipse_draggable(e2);
}
