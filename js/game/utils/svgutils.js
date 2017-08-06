/**
 * Created by Jean-Baptiste on 2/22/2017.
 */
"use strict";
var

    deltaTransformPoint = function (matrix, point) {

        var dx = point.x * matrix.a + point.y * matrix.c + 0;
        var dy = point.x * matrix.b + point.y * matrix.d + 0;
        return {x: dx, y: dy};
    },
    decomposeMatrix = function (matrix) {

        // @see https://gist.github.com/2052247

        // calculate delta transform point
        var px = deltaTransformPoint(matrix, {x: 0, y: 1});
        var py = deltaTransformPoint(matrix, {x: 1, y: 0});

        // calculate skew
        var skewX = ((180 / Math.PI) * Math.atan2(px.y, px.x) - 90);
        var skewY = ((180 / Math.PI) * Math.atan2(py.y, py.x));

        return {

            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
            scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
            skewX: skewX,
            skewY: skewY,
            rotation: skewX // rotation is the same as skew x
        }
    },
    polarToCartesian = function (centerX, centerY, radius, angleInDegrees) {
        var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    },
    applyAttributes = function (el, params_obj, namespaceParams_array) {
        if (params_obj) {
            for (var n in params_obj) {
                if (params_obj.hasOwnProperty(n)) {
                    el.setAttribute(n, params_obj[n]);
                }
            }
        }
        if (namespaceParams_array) {
            namespaceParams_array.forEach(function (attr) {
                el.setAttributeNS(attr.nameSpace, attr.name, attr.value);
            });
        }
    },
    createElement = function (svgTagName_str, params_obj, namespaceParams_array) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", svgTagName_str);
        applyAttributes(el, params_obj, namespaceParams_array);
        return el;
    },
    getSliceAttribute = function (centerX, centerY, radius, holeRadius, p_startAngle, p_endAngle) {
        var startAngle = p_startAngle,
            endAngle = p_endAngle,
            externalCurve_obj = getArc(centerX, centerY, radius, startAngle, endAngle),
            internalCurve_obj = getArc(centerX, centerY, holeRadius, endAngle, startAngle, true),
            intToExtPath_str = " L" + externalCurve_obj.startPoint + " ",
            extToIntPath_str = "L" + internalCurve_obj.startPoint + " ";
        return internalCurve_obj.path + intToExtPath_str + externalCurve_obj.path + extToIntPath_str;

    },
    getArc = function (x, y, radius, startAngle, endAngle, inverseArc_bool) {
        var start = polarToCartesian(x, y, radius, endAngle),
            end = polarToCartesian(x, y, radius, startAngle),
            arcSweep = (endAngle - startAngle > 180) ? 1 : 0,
            //Number(Boolean(Math.abs(endAngle - startAngle) <= 180)),
            inverseArc = isNaN(inverseArc_bool) ? 0 : Number(inverseArc_bool),
            d_string = ["M", start.x, start.y, "A", radius, radius, 0, arcSweep, inverseArc, end.x, end.y].join(" ");
        return {
            path: d_string,
            endPoint: end.x + " " + end.y,
            startPoint: start.x + " " + start.y
        };
    },
    PointConversion = {
        SVGToPoint: function (SVGPoint) {
            return {x: SVGPoint.x, y: SVGPoint.y};
        },
        pointToSVG: function (svg_el, point) {
            var svg_point = svg_el.createSVGPoint();
            svg_point.x = point.x;
            svg_point.y = point.y;
            return svg_point;
        }
    };
module.exports = {

    getSliceAttribute: getSliceAttribute,
    getSlice: function (centerX, centerY, radius, holeRadius, p_startAngle, p_endAngle) {
        var path = createElement("path");
        path.setAttribute("d", getSliceAttribute(centerX, centerY, radius, holeRadius, p_startAngle, p_endAngle));
        return path;
    },
    getMultilineText: function (parentSvg_el, text_str, params) {
        console.log('params multiline : ', params);
        var
            forceLineBreakChar = params.forceLineBreakChar,
            forceLineBreakBool,
            container_g = createElement('svg', {
                x: params.x,
                y: params.y
            }),

            line_num = 0,
            text_array = text_str.split(' '),
            createTextBlock = function () {
                var line_span = createElement('text', {
                    x: (params['text-anchor'] === 'middle') ? params.width / 2 : 0,
                    'width': params.width,
                    'text-anchor': params['text-anchor'],
                    'font-size': params['font-size'],
                    'fill': params.color,
                    'stroke': params.stroke || null,
                    'font-weight': params['font-weight'] || null,
                    'stroke-width': params['stroke-width'] || null,
                    'dy': (params.lineHeight * line_num) + params.lineHeight
                });

                container_g.appendChild(line_span);
                line_num++;
                return line_span;
            },
            previousLineContent_str = '',
            lineContent_str = '',
            block_el = createTextBlock();
        parentSvg_el.appendChild(container_g);

        text_array.forEach(function (word) {
            lineContent_str += word + ' ';
            block_el.textContent = lineContent_str;
            if (block_el.getComputedTextLength() > params.width || forceLineBreakBool) {
                block_el.textContent = previousLineContent_str;
                block_el = createTextBlock();
                lineContent_str = word + ' ';
                block_el.textContent = lineContent_str;
            }
            forceLineBreakBool = word.indexOf(forceLineBreakChar) !== -1;
            previousLineContent_str = lineContent_str;
        });
        return container_g;
    },
    simulateEnterClick: function (svg_el, fun) {
        var
            removeEnterClick = function () {
                svg_el.removeEventListener('focus', listenEnter);
                svg_el.removeEventListener('blur', stopListen);
            },
            handleKey = function (evt) {
                if (evt.key === "Enter") {
                    removeEnterClickremoveEnterClick();
                    fun();
                }
            },
            listenEnter = function () {
                svg_el.addEventListener('keydown', handleKey);
            },
            stopListen = function () {
                svg_el.addEventListener('keydown', handleKey);
            };
        svg_el.addEventListener('focus', listenEnter);
        svg_el.addEventListener('blur', stopListen);
        return removeEnterClick;

    },
    /**
     *
     * Source: https://msdn.microsoft.com/en-us/library/hh535760(v=vs.85).aspx
     * @param {Point} point
     * @param dom_svg
     * @returns {SVGPoint}
     */
    convertCoordinateFromDOMToSVG: function (dom_svg, point) {
        var
            CTM = dom_svg.getScreenCTM(),
            svg_point = PointConversion.pointToSVG(dom_svg, point),
            converted_point = svg_point.matrixTransform(CTM.inverse());
        return PointConversion.SVGToPoint(converted_point);
    },
    convertCoordinateFromSVGToDOM: function (dom_svg, svgCoordinate_point) {
        var
            CTM = dom_svg.getScreenCTM(),
            svg_point = PointConversion.pointToSVG(dom_svg, svgCoordinate_point),
            converted_point = svg_point.matrixTransform(CTM),
            matrixRead = decomposeMatrix(CTM),
            point = {
                x: matrixRead.translateX + (svgCoordinate_point.x * matrixRead.scaleX),
                y: matrixRead.translateY + (svgCoordinate_point.y * matrixRead.scaleY)
            };
        console.log("point test : ", matrixRead);
        return point;
    },
    applyAttributes: applyAttributes,
    createElement: createElement
};



