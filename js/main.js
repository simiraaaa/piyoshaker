/// <reference path="tmlib.js"/>

(function (tm, undefined) {
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

    var GRAVITIES = [1, 2, 4, 8, 16];

    var SCORES = {
        1: 1,
        2: 3,
        4: 7,
        8: 12,
        16: 24,
    };

    // ‚Ð‚æ‚±‚©‚¼‚¦‚é‚â‚Â
    var piyoCounter = {
        1: 0,
        2: 0,
        4: 0,
        8: 0,
        16: 0,

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
            NORMAL: createFormArray([0, 1, 2, 3]),
            BIKKURI: createFormArray([4]),
            DOWN: createFormArray([5]),
            FRONT: createFormArray([6, 7, 8]),
            BACK: createFormArray([9, 10, 11]),
            LEFT: createFormArray([12, 13, 14]),
            RIGHT: createFormArray([15, 16, 17]),
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
            8: 'niwa',
            16: 'mecha',
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
            niwa: 8,
            mecha: 16,
            1: 1,
            2: 2,
            4: 4,
            8: 8,
            16: 16,

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
            frequency: 15,
        },
        down: {
            frames: PIYO.FORM.DOWN,
            next: 'bikkuri',
            frequency: 45,
        },

        front: {
            frames: PIYO.FORM.FRONT,
            next: 'front',
            frequency: 5,
        },


        back: {
            frames: PIYO.FORM.BACK,
            next: 'back',
            frequency: 5,
        },


        left: {
            frames: PIYO.FORM.LEFT,
            next: 'left',
            frequency: 5,
        },


        right: {
            frames: PIYO.FORM.RIGHT,
            next: 'right',
            frequency: 5,
        },
    };

    PIYO.SHEETS = {};
    ['normal', 'waru', 'lady', 'niwa', 'mecha'].forEach(function (e) {
        PIYO.SHEETS[e] = tm.asset.SpriteSheet({
            images: e,
            frames: PIYO.FRAMES,
            animations: PIYO.ANIMATION,
        });
    });

    var ASSETS = {
        bg: 'assets/piyoshakebg.png',
        normal: 'assets/hiyoco_nomal_full.png',
        waru: 'assets/hiyoco_waru_full.png',
        lady: 'assets/hiyoco_lady_full.png',
        mecha: 'assets/hiyoco_mecha_full.png',
        niwa: 'assets/hiyoco_niwatori_full.png',
    };


    // ‚Ð‚æ‚±ƒNƒ‰ƒX
    var Hiyoko = tm.define('', {
        superClass: tm.display.AnimationSprite,
        piyo_name: null,
        form_type: null,
        form_index: null,

        init: function (name) {
            this.superInit(PIYO.SHEETS[this.piyo_name = PIYO.SPRITES_NAME[name]], PIYO.SIZE, PIYO.SIZE);
            this.$extend(Hiyoko.getInitProp());
            this.gotoAndplay(this.form_type = PIYO.FORM.getAnimationName(dx, dy));

            piyoCounter[this.form_index = PIYO.SPRITES_INDEX[name]]++;
        },

        toggle: function () {
            this.gotoAndPlay(this.piyo_name = PIYO.FORM.toggle(this.piyo_name));
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


        //˜gŠOx
        isOutSideX: function () {
            var half = PIYO.HALF_SIZE;
            return half > this.x || this.x > S_WIDTH - half;
        },

        //˜gŠOy
        isOutSideY: function () {
            var half = PIYO.HALF_SIZE;
            return this.y < half || this.y > half + S_HEIGHT;
        },




    }).$extend({
        //static
        getInitProp: function () {
            var rand = Math.random();
            var awake = Math.random() < 0.1;
            return {
                x: Math.rand(PIYO.SIZE, S_WIDTH - PIYO.SIZE),
                y: Math.rand(PIYO.SIZE, S_WIDTH - PIYO.SIZE),
                dx: Hiyoko.SPEED * rand * PIYO.nop() * awake,
                dy: Hiyoko.SPEED * (1 - rand) * PIYO.nop() * awake,
            };
        },
        SPEED: 5,
        
    });


    var app;
    tm.main(function () {
        app = display.CanvasApp('#world');

        app.resize(S_WIDTH, S_HEIGHT).fitWindow().fps = 60;

        app.replaceScene(tm.game.LoadingScene({
            nextScene: TitleScene,
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
            var bg = p.bg;
            var scene = p.next;
            this.setNext(scene).setBG(bg);
            this.spriteLayer = CanvasElement().addChildTo(this);
            this.labelLayer = CanvasElement().addChildTo(this);
        },

        replaceScene: function (scene) {
            scene = scene || this.nextScene;
            scene && app.replaceScene(scene);
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
            this.bg = Sprite(bg)
                .setOrigin(0, 0)
                .setWidth(S_WIDTH)
                .setHeight(S_HEIGHT)
                .addChildTo(this);
            return this;
        },

    });
    var TitleScene = tm.define('', {
        superClass: SuperScene,
        init: function () {
            this.superInit({bg:'bg'});
            this.debug = DebugLabel(100, 100).addChildTo(this.labelLayer);
        },
        update: function (app) {
            app.frame % 30 === 0 && this.spriteLayer.addChild(Hiyoko([1,2,4,8,16].pickup()));
        },
    });

    var DebugLabel = tm.define('', {
        superClass: Label,

        init: function (x, y) {
            this.superInit();
            this.setup();

        },

        update: function (a) { this.setup();},

        setup: function () {
            var t = '';
            for (var k in piyoCounter) {
                t += PIYO.SPRITES_NAME[k] + ':' + piyoCounter[k] + '\n';
            }
            this.text = t;
        }

    });


})(tm);