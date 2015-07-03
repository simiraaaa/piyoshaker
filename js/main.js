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

    var GRAVITIES = [1, 2, 4, 6, 10];

    function createGravitiesParameter(arr) {
        var obj = {};
        GRAVITIES.forEach(function (e, i) {
            obj[e] = arr[i];
        });
        return obj;
    }

    var SCORES = createGravitiesParameter([1, 3, 9, 16, 40]);

    // ひよこかぞえるやつ
    var piyoCounter = createGravitiesParameter([0, 0, 0, 0, 0]);

    var PIYO = {
        SIZE: 32,
        HALF_SIZE: 16,

        either: function (x, y) {
            return Math.random() < 0.5 ? x : y;
        },

        // negative or positive
        nop: function () {
            return this.either(1, -1);
        },

        FORM: {
            NORMAL: createFormArray([0, 1, 2, 3, 2, 1]),
            BIKKURI: createFormArray([4]),
            DOWN: createFormArray([5]),
            FRONT: createFormArray([6, 7, 8, 7]),
            BACK: createFormArray([9, 10, 11, 10]),
            LEFT: createFormArray([12, 13, 14, 13]),
            RIGHT: createFormArray([15, 16, 17, 16]),
            getHorizon: function (x) {
                return x < 0 ? 'left' : 'right';
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
                right: 'x',
            },
        },
        SPRITES_NAME: createGravitiesParameter(['normal', 'lady', 'waru', 'niwa', 'mecha']).$extend({
            normal: 'normal',
            lady: 'lady',
            waru: 'waru',
            niwa: 'niwa',
            mecha: 'mecha',

        }),
        SPRITES_INDEX: createGravitiesParameter(GRAVITIES).$extend({
            normal: 1,
            lady: 2,
            waru: 4,
            niwa: 6,
            mecha: 10,
        }),

    };

    PIYO.FRAMES = {
        width: PIYO.SIZE,
        height: PIYO.SIZE,
        count: 18,
    };

    PIYO.ANIMATION = {

        normal: {
            frames: PIYO.FORM.NORMAL,
            next: 'normal',
            frequency: 3,
        },

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

        keifont: 'assets/keifont-kana.ttf',
        number: 'assets/Ubuntu-Title.ttf',
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
        __frame: 0,

        init: function (name, form, awake, count) {

            this.superInit(PIYO.SHEETS[PIYO.SPRITES_NAME[name]], PIYO.SIZE, PIYO.SIZE);
            this.$extend(Hiyoko.getInitProp());

            this.gotoAndPlay(this.form_to = form || PIYO.FORM.getAnimationName(this.dx, this.dy));


            this.form_type = PIYO.FORM.type[this.form_to];

            // originalのonenterframeを使う
            this.clearEventListener('enterframe');
            awake === undefined || awake || (this.update = this._emptyFunction);
            if (count === undefined || count) {
                piyoCounter[this.form_index = PIYO.SPRITES_INDEX[name]]++;
                Hiyoko.pushInstance(this);
            }
        },

        onenterframe: function (e) {
            ++this.__frame % this.currentAnimation.frequency || (this._updateFrame(), this.__frame = 0);
        },

        toggle: function () {
            this.__frame = 0;
            this.gotoAndPlay(this.form_to = PIYO.FORM.toggle(this.form_to));
            this.form_type = PIYO.FORM.type[this.form_to];
            return this;
        },

        _emptyFunction: function () { },

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
            return this.y < half || this.y > S_HEIGHT - half;
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
                dy: speed * (1 - rand) * PIYO.nop() * awake,
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
        MAX_INSTANCE: 500,

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
            assets: ASSETS,
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
            if (!p) return;
            this.setNext(p.next).setBG(p.bg);
            this.spriteLayer = CanvasElement().addChildTo(this);
            this.labelLayer = CanvasElement().addChildTo(this);
        },

        addSensors: function () {
            for (var k in sensors) {
                sensors[k].addChildTo(this);
            }
        },

        sensorCheck: function (func) {
            for (var k in sensors) {
                sensors[k].isShaking() && func(k);
            }
        },

        rmeoveSensors: function () {
            for (var k in sensors) {
                sensors[k].remove().clear();
            }
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
            bg && (this.bg = Sprite(bg)
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

        update: function () { this.replaceScene(); },
    });

    var TitleScene = tm.define('', {
        superClass: SuperScene,
        init: function () {
            this.superInit({ bg: 'bg' });
            var animations = [];

            animations.push(Label('ぴよ', 50).$extend({
                fontFamily: 'keifont',
                x: 70,
                y: -40,
                rotation: 270,
                fillStyle: 'yellow',
                scaleY: 0.3,
            }).addChildTo(this.labelLayer).tweener.to({
                rotation: -15,
                scaleY: 1,
                y: 160,
            }, 1500, 'easeOutBounce'));


            animations.push(Label('シェイカー', 40).$extend({
                fontFamily: 'keifont',
                x: 500,
                y: 160,
                align: 'left',
                fillStyle: 'yellow'
            }).addChildTo(this.labelLayer).tweener.wait(400).to({
                x: 120,
            }, 300).to({
                rotation: -45,
                scaleX: 0.5
            }, 300, 'easeOutCirc').to({
                rotation: -30,
                scaleX: 0.7
            }, 250, 'easeInCirc').to({
                rotation: 0,
                scaleX: 1
            }, 200, 'easeOutBounce'));

            var hiyoko = Hiyoko('normal', 'normal', false, false).addChildTo(this.spriteLayer);
            hiyoko.setPosition(130, 170).setScale(-1, 1);

            hiyoko.tweener.wait(500).call(function () {
                hiyoko.gotoAndStop('bikkuri');
                hiyoko.onenterframe = null;
            }).wait(200).to({
                rotation: 360,
                x: 16,
                y: 50,
            }, 300).to({
                rotation: 720 - 180,
                x: 230,
                y: 16,
            }, 350).to({
                rotation: 720 - 90,
                x: 260,
                y: 81,
            }, 150).to({
                rotation: 720,
                x: 290,
                y: 141,
            }, 300, 'easeOutBounce').call(function () {
                hiyoko.gotoAndStop('down');
                hiyoko.awake = false;



                var startButton = display.RoundRectangleShape({
                    width: 160 * 1.618,
                    height: 40,
                    x: S_WIDTH / 2,
                    y: S_HEIGHT * 0.7,
                    lineWidth: 5,
                    strokeStyle: 'yellow',
                    fillStyle: 'gold',
                    onpointingstart: function (e) {
                        disableButton();
                        self.setNext(GameScene);
                        HiyokoFader.fade('in', self);
                    },
                }).setInteractive(!0, 'rect');
                startButton
                    .addChildTo(self.labelLayer)
                    .addChild(Label('ゲームスタートぴよ', 30).$extend({
                        fontFamily: 'keifont',
                        fillStyle: 'black',
                        x: 2,
                    }));


                function disableButton() {
                    startButton.setInteractive(!1);
                    endlessButton.setInteractive(!1);
                }

                var endlessButton = display.RoundRectangleShape({
                    width: 285,
                    height: 40,
                    x: S_WIDTH / 2,
                    y: S_HEIGHT * 0.85,
                    lineWidth: 5,
                    strokeStyle: 'yellow',
                    fillStyle: 'gold',
                    onpointingstart: function (e) {
                        disableButton();
                        alert('まだ出来てないぴよ');
                    },
                }).setInteractive(!0, 'rect');
                endlessButton
                    .setBoundingType('rect')
                    .addChildTo(self.labelLayer)
                    .addChild(Label('エンドレスモードぴよ', 30).$extend({
                        fontFamily: 'keifont',
                        fillStyle: 'black',
                        x: 2,
                    }));

            });
            var self = this;

            animations.push(hiyoko.tweener);

            this.onpointingstart = function (e) {
                var app = e.app;
                self.onpointingstart = null;
                animations.forEach(function (e) { (100).times(function () { e.update(app); }); });
            };


            this.debug = DebugLabel(100, 10).addChildTo(this.labelLayer);
            this.addSensors();

        },
        update: function (app) {
            this.sensorCheck(function (k) {
                Hiyoko(k).addChildTo(app.currentScene.spriteLayer);
            });
        },
    });




    var GameScene = tm.define('', {
        superClass: SuperScene,

        time: 10000, //10sec.
        init: function () {
            this.superInit({
                bg: 'bg',
                next: TitleScene,
            });
            HiyokoFader.fade('out', this);
        },


    });

    var HiyokoFader = tm.define('', {
        superClass: CanvasElement,

        blackImage: display.RectangleShape({
            width: S_WIDTH * 1.1,
            height: PIYO.SIZE,
            fillStyle: 'black',
            strokeStyle: 'transparent'
        }).canvas,

        rightAnim: {
            x: S_WIDTH * 1.05,
        },
        leftAnim: {
            x: S_WIDTH * -0.05,
        },

        ended: false,

        init: function (p) {
            this.superInit();
            p = p || {};
            var isLeft = p.direction === 'left';
            var direction = p.direction || 'right';
            var isFront = p.type === 'front';
            this.setOrigin(0, 0);
            this.y = p.y || 0;
            this.x = isLeft ? S_WIDTH * 1.05 : -0.05 * S_WIDTH;
            var origin = isLeft ^ isFront;
            var black = Sprite(this.blackImage).setOrigin(isLeft ^ isFront, 0);
            for (var i = 0, end = S_WIDTH / PIYO.SIZE / 2; i < end; ++i) {
                var y = i * PIYO.SIZE * 2;
                Sprite(this.blackImage).setOrigin(origin, 0).setPosition(0, y).addChildTo(this);
                Hiyoko(GRAVITIES.pickup(), direction, false, false)
                    .addChildTo(this).$extend({
                        y: y,
                        x: 0,
                        originY: 0,
                    });
            }

            this._anim = isLeft ? this.leftAnim : this.rightAnim;

            var self = this;

            this.tweener.to(this._anim, 1200).call(this.getEndedFunction());

        },

        getEndedFunction: function () {
            var self = this;
            return this._endedFunction || (this._endedFunction = function () {
                self.fire(tm.event.Event('end'));
                self.ended = true;
            });
        },

        addSkipEventToScene: function (scene) {
            var self = this;
            scene.on('pointingstart', function () { self.skip(); });
            return this;
        },

        skip: function () {
            this.ended || this.tweener.clear().to(this._anim, 1).call(this.getEndedFunction());
            return this;
        }

    }).$extend({
        fade: function (type, scene, onend) {
            var isIn = type === 'in';
            var fader = HiyokoFader({
                direction: 'right',
                type: isIn ? 'front' : '',
                y: PIYO.SIZE
            }).addChildTo(scene).addSkipEventToScene(scene);

            var fader2 = HiyokoFader({
                direction: 'left',
                type: isIn ? 'front' : '',
            }).addChildTo(scene).addSkipEventToScene(scene);

            isIn && (fader2.onend = function () {
                scene.replaceScene();
                onend && onend();
            });
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

        update: function (a) { this.setup(); },

        setup: function () {
            var t = '';
            var all = 0;
            for (var k in piyoCounter) {
                var c = piyoCounter[k];
                all += c;
                t += PIYO.SPRITES_NAME[k] + ':' + c + '\n';
            }
            this.text = t + 'all:' + all;
        }

    });


})(tm);