Utils = {
    getRandomColor: function() {
        var letters = '0123456789ABCDEF'.split('');
        var color = '#';
        for (var i = 0; i < 6; i++ ) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    getItems: function(obj) {
        return _.map(Object.keys(obj), function(key) {
            return obj[key];
        });
    },
    getComplementoryColor: function(color_in_hex) {
        if(color_in_hex.length === 4) {
            var hex = color_in_hex;
            color_in_hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }

        var rgbToHex = function (r, g, b) {
            var componentToHex = function (c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex : hex;
            };

            return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
        };

        var hexToRgb = function (hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        };

        var rgb2hsv = function (rgb) {
            var hsv = new Object(),
                max=max3(rgb.r,rgb.g,rgb.b),
                dif=max-min3(rgb.r,rgb.g,rgb.b);

            hsv.saturation=(max==0.0)?0:(100*dif/max);

            if (hsv.saturation==0)
                hsv.hue=0;
            else
                if (rgb.r==max) hsv.hue=60.0*(rgb.g-rgb.b)/dif;
            else
                if (rgb.g==max) hsv.hue=120.0+60.0*(rgb.b-rgb.r)/dif;
            else
                if (rgb.b==max) hsv.hue=240.0+60.0*(rgb.r-rgb.g)/dif;
            if (hsv.hue<0.0)
                hsv.hue+=360.0;

            hsv.value=Math.round(max*100/255);
            hsv.hue=Math.round(hsv.hue);
            hsv.saturation=Math.round(hsv.saturation);

            return hsv;
        };

        // rgb2hsv and hsv2rgb are based on Color Match Remix [http://color.twysted.net/]
        // which is based on or copied from ColorMatch 5K [http://colormatch.dk/]
        var hsv2rgb = function (hsv) {
            var rgb=new Object();

            if (hsv.saturation==0) {
                rgb.r=rgb.g=rgb.b=Math.round(hsv.value*2.55);
            } else {
                hsv.hue/=60;
                hsv.saturation/=100;
                hsv.value/=100;

                var i=Math.floor(hsv.hue),
                    f=hsv.hue-i,
                    p=hsv.value*(1-hsv.saturation),
                    q=hsv.value*(1-hsv.saturation*f),
                    t=hsv.value*(1-hsv.saturation*(1-f));

                switch(i) {
                case 0: rgb.r=hsv.value; rgb.g=t; rgb.b=p; break;
                case 1: rgb.r=q; rgb.g=hsv.value; rgb.b=p; break;
                case 2: rgb.r=p; rgb.g=hsv.value; rgb.b=t; break;
                case 3: rgb.r=p; rgb.g=q; rgb.b=hsv.value; break;
                case 4: rgb.r=t; rgb.g=p; rgb.b=hsv.value; break;
                default: rgb.r=hsv.value; rgb.g=p; rgb.b=q;
                }
                rgb.r=Math.round(rgb.r*255);
                rgb.g=Math.round(rgb.g*255);
                rgb.b=Math.round(rgb.b*255);
            }
            return rgb;
        };

        //Adding hueShift via Jacob (see comments)
        var hueShift = function(h,s) {
            h+=s; while (h>=360.0) h-=360.0; while (h<0.0) h+=360.0; return h;
        };

        //min max via Hairgami_Master (see comments)
        var min3 = function (a,b,c) {
            return (a<b)?((a<c)?a:c):((b<c)?b:c);
        };
        var max3 = function (a,b,c) {
            return (a>b)?((a>c)?a:c):((b>c)?b:c);
        };

        var temprgb = hexToRgb(color_in_hex),
            temphsv = rgb2hsv(temprgb);

        temphsv.hue = hueShift(temphsv.hue,180.0);
        temprgb = hsv2rgb(temphsv);

        return rgbToHex(temprgb.r, temprgb.g, temprgb.b);
    },
    shortenText: function(str, max) {
        if(!str) return false;

        if (str.length > max) {
            return str.substr(0, parseInt(max/2)-3) + '...' + str.substr(str.length-parseInt(max/2), str.length);
        }
        return str;
    }
};
