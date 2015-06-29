/// <reference path="tmlib.js"/>

(function (tm, undefined) {

    tm.asset.Script.loadStats();
    // debug

    var window = tm.global;
    // localize
    var Math = window.Math;

    //tm localize    
    var assets = tm.asset.Manager.assets;

    var display = tm.display,
        Label = display.Label,
        CanvasElement = display.CanvasElement,
        Sprite = display.Sprite;



    // const
    var S_WIDTH = 320,
        S_HEIGHT = 320;

    var createFormArray = (function () {
        function f() {
            return this[0];
        };

        return function (a) {
            a.valueOf = a.toString = f;
            return a;
        };
    })();

    var GRAVITIES = [1, 2, 4, 7, 14];

    var SCORES = {
        1: 1,
        2: 3,
        4: 7,
        7: 15,
        14: 50,
    };

    // ひよこかぞえるやつ
    var piyoCounter = {
        1: 0,
        2: 0,
        4: 0,
        7: 0,
        14: 0,

    };

    var PIYO = {
        SIZE: 32,
        HALF_SIZE:16,
        
        either: function (x, y) {
            return Math.random() < 0.5 ? x : y;
        },

        // negative or positive
        nop: function () {
            return this.either(1, -1);
        },

        FORM: {
            NORMAL: createFormArray([0, 1, 2, 3,2,1]),
            BIKKURI: createFormArray([4]),
            DOWN: createFormArray([5]),
            FRONT: createFormArray([6, 7, 8,7]),
            BACK: createFormArray([9, 10, 11,10]),
            LEFT: createFormArray([12, 13, 14,13]),
            RIGHT: createFormArray([15, 16, 17,16]),
            getHorizon: function (x) {
                return x < 0 ? 'left' : 'right' ;
            },
            getVertical: function (x) {
                return x < 0 ? 'back' : 'front';
            },

            getAnimationName: function (x, y) {
                if (x === 0 && y === 0) return 'down';
                return Math.abs(x) < Math.abs(y) ? this.getVertical(y) : this.getHorizon(x);
            },

            toggle: function (name) {
                return this.to[name];
            },

            to: {
                bikkuri: 'down',
                down: 'bikkuri',
                front: 'back',
                back: 'front',
                left: 'right',
                right: 'left',
            },

            type: {
                bikkuri: 'y',
                down: 'y',
                front: 'y',
                back: 'y',
                left: 'x',
                right:'x',
            },
        },
        SPRITES_NAME: {
            1: 'normal',
            2: 'lady',
            4: 'waru',
            7: 'niwa',
            14: 'mecha',
            normal: 'normal',
            lady: 'lady',
            waru: 'waru',
            niwa: 'niwa',
            mecha: 'mecha',

        },
        SPRITES_INDEX: {
            normal: 1,
            lady: 2,
            waru: 4,
            niwa: 7,
            mecha: 14,
            1: 1,
            2: 2,
            4: 4,
            7: 7,
            14: 14,

        },

    };

    PIYO.FRAMES = {
        width: PIYO.SIZE,
        height: PIYO.SIZE,
        count: 18,
    };

    PIYO.ANIMATION = {
        bikkuri: {
            frames: PIYO.FORM.BIKKURI,
            next: 'down',
            frequency: 40,
        },
        down: {
            frames: PIYO.FORM.DOWN,
            next: 'bikkuri',
            frequency: 90,
        },

        front: {
            frames: PIYO.FORM.FRONT,
            next: 'front',
            frequency: 3,
        },


        back: {
            frames: PIYO.FORM.BACK,
            next: 'back',
            frequency: 3,
        },


        left: {
            frames: PIYO.FORM.LEFT,
            next: 'left',
            frequency: 3,
        },


        right: {
            frames: PIYO.FORM.RIGHT,
            next: 'right',
            frequency: 3,
        },
    };

    PIYO.SHEETS = {};

    var ASSETS = {
        bg: 'assets/piyoshakebg.png',
        normal: 'assets/hiyoco_nomal_full.png',
        waru: 'assets/hiyoco_waru_full.png',
        lady: 'assets/hiyoco_lady_full.png',
        mecha: 'assets/hiyoco_mecha_full.png',
        niwa: 'assets/hiyoco_niwatori_full.png',
    };


    var accel = tm.input.Accelerometer();
    var sensors = {};
    GRAVITIES.forEach(function (e) {
        sensors[e] = tm.input.ShakeSensor(accel).setThresholdByGravity(e);
    });


    // ひよこクラス
    var Hiyoko = tm.define('', {
        superClass: tm.display.AnimationSprite,
        piyo_name: null,
        form_type: null,
        form_to: null,
        form_index: null,
        __frame:0,

        init: function (name) {
            this.superInit(PIYO.SHEETS[PIYO.SPRITES_NAME[name]], PIYO.SIZE, PIYO.SIZE);
            this.$extend(Hiyoko.getInitProp());
            this.gotoAndPlay(this.form_to = PIYO.FORM.getAnimationName(this.dx, this.dy));

            piyoCounter[this.form_index = PIYO.SPRITES_INDEX[name]]++;

            this.form_type = PIYO.FORM.type[this.form_to];

            // originalのonenterframeを使う
            this.clearEventListener('enterframe');

            Hiyoko.pushInstance(this);
        },

        onenterframe: function (e) {
            ++this.__frame % this.currentAnimation.frequency || (this._updateFrame(),this.__frame=0);
        },

        toggle: function () {
            this.__frame = 0;
            this.gotoAndPlay(this.form_to = PIYO.FORM.toggle(this.form_to));
            this.form_type = PIYO.FORM.type[this.form_to];
            return this;
        },

        update: function (app) {
            this.x += this.dx;
            this.y += this.dy;

            if (this.isOutSideX()) {
                this.dx *= -1;
                this.form_type === 'x' && this.toggle();
            }
            if (this.isOutSideY()) {
                this.dy *= -1;
                this.form_type === 'y' && this.toggle();
            }
        },


        //枠外x
        isOutSideX: function () {
            var half = PIYO.HALF_SIZE;
            return half > this.x || this.x > S_WIDTH - half;
        },

        //枠外y
        isOutSideY: function () {
            var half = PIYO.HALF_SIZE;
            return this.y < half || this.y > S_HEIGHT -half;
        },




    }).$extend({
        //static
        getInitProp: function () {
            var rand = Math.random();
            var speed = Hiyoko.SPEED * (Math.random() + 0.5);
            var awake = Math.random() > 0.1;
            return {
                x: Math.rand(PIYO.SIZE, S_WIDTH - PIYO.SIZE),
                y: Math.rand(PIYO.SIZE, S_WIDTH - PIYO.SIZE),
                dx: speed * rand * PIYO.nop() * awake,
                dy: speed* (1 - rand) * PIYO.nop() * awake,
            };
        },
        SPEED: 3,

        instanceList: [],
        pushInstance: function (ins) {
            var len = this.instanceList.push(ins);
            if (len > this.MAX_INSTANCE) {
                this.instanceList.shift().remove();
            }
        },
        MAX_INSTANCE:500,
        
    });


    var app;
    tm.main(function () {
        app = display.CanvasApp('#world');
        //window.app = app;
        app.resize(S_WIDTH, S_HEIGHT).fitWindow();
        app.enableStats();
        app.replaceScene(tm.game.LoadingScene({
            nextScene: SetupScene,
            width: S_WIDTH,
            height: S_HEIGHT,
            assets:ASSETS,
        }));

        app.run();
    });


    var SuperScene = tm.define('', {
        superClass: tm.app.Scene,

        nextScene: null,
        bg: null,

        spriteLayer: null,
        labelLayer: null,

        init: function (p) {
            this.superInit();
            if(!p)return;
            this.setNext(p.next).setBG(p.bg);
            this.spriteLayer = CanvasElement().addChildTo(this);
            this.labelLayer = CanvasElement().addChildTo(this);
        },

        replaceScene: function (scene) {
            scene = scene || this.nextScene;
            scene && app.replaceScene(scene());
        },

        popScene: function (scene) {
            app.popScene();
            this.replaceScene(scene);
        },

        setNext: function (s) {
            this.nextScene = s;
            return this;
        },

        setBG: function (bg) {
            bg&&(this.bg = Sprite(bg)
                .setOrigin(0, 0)
                .setWidth(S_WIDTH)
                .setHeight(S_HEIGHT)
                .addChildTo(this));
            return this;
        },

    });

    var SetupScene = tm.define('', {
        superClass: SuperScene,

        init: function () {
            this.superInit({ next: TitleScene });

            ['normal', 'waru', 'lady', 'niwa', 'mecha'].forEach(function (e) {
                PIYO.SHEETS[e] = tm.asset.SpriteSheet({
                    image: assets[e],
                    frame: PIYO.FRAMES,
                    animations: PIYO.ANIMATION,
                });
            });
           // this.replaceScene();
        },

        update: function () { this.replaceScene();},
    });

    var TitleScene = tm.define('', {
        superClass: SuperScene,
        init: function () {
            this.superInit({bg:'bg'});
            this.debug = DebugLabel(100, 10).addChildTo(this.labelLayer);
            for (var k in sensors) {
                sensors[k].addChildTo(this);
            } 
        },
        update: function (app) {
            for (var k in sensors) {
                if (sensors[k].isShaking()) {
                    Hiyoko(k).addChildTo(this.spriteLayer);
                }   
            }
        },
    });

    var DebugLabel = tm.define('', {
        superClass: Label,

        init: function (x, y) {
            this.superInit();
            this.setup();
            this.fillStyle = 'black';
            this.setPosition(x | 0, y | 0);

        },

        update: function (a) { this.setup();},

        setup: function () {
            var t = '';
            var all = 0;
            for (var k in piyoCounter) {
                var c = piyoCounter[k];
                all += c;
                t += PIYO.SPRITES_NAME[k] + ':' + c + '\n';
            }
            this.text = t+'all:'+all;
        }

    });


})(tm);