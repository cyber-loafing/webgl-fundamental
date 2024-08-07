export interface SliderOptions {
    name?: string;
    precision?: number;
    min?: number;
    step?: number;
    value?: number;
    max?: number;
    slide?: (event: Event, uiInfo: { value: number }) => void;
    uiPrecision?: number;
    uiMult?: number;
}

export interface CheckboxOptions {
    name: string;
    value: boolean;
    change: (event: Event, uiInfo: { value: boolean }) => void;
}

export interface OptionOptions {
    name: string;
    value: number;
    options: string[];
    change: (event: Event, uiInfo: { value: number }) => void;
}

export interface UIInfo {
    type: string;
    key: string;
    name?: string;
    value?: any;
    change?: () => void;
    slide?: (event: Event, uiInfo: { value: number }) => void;
    options?: string[];
}

export interface Widgets {
    [key: string]: {
        elem: HTMLElement;
        updateValue: (v: any) => void;
    };
}

export class WebglLessonsUI {
    private gopt: { [key: string]: string };

    constructor() {
        this.gopt = this.getQueryParams();
    }

    public setupSlider(selector: string, options: SliderOptions) {
        const parent = document.querySelector(selector);
        if (!parent) {
            return;
        }
        if (!options.name) {
            options.name = selector.substring(1);
        }
        return this.createSlider(parent, options);
    }

    private createSlider(parent: HTMLElement, options: SliderOptions) {
        const precision = options.precision || 3;
        const min = options.min || 0;
        const step = options.step || 1;  // 允许浮点数
        const value = options.value || 0;
        const max = options.max || 1;
        const fn = options.slide;
        const name = this.gopt["ui-" + options.name] || options.name;
        const uiPrecision = options.uiPrecision === undefined ? precision : options.uiPrecision;
        const uiMult = options.uiMult || 1;

        parent.innerHTML = `
            <div class="gman-widget-outer" style="display: flex; align-items: center;">
                <div class="gman-widget-label" style="margin-right: 5px;">${name}</div>
                <input class="gman-widget-slider" type="range" min="${min}" max="${max}" value="${value}" step="${step}" style="width: 100%;" />
                <div class="gman-widget-value" style="margin-left: 5px;"></div>
            </div>
        `;

        const valueElem = parent.querySelector(".gman-widget-value") as HTMLElement;
        const sliderElem = parent.querySelector(".gman-widget-slider") as HTMLInputElement;

        const updateValue = (value: number) => {
            valueElem.textContent = (value * uiMult).toFixed(uiPrecision);  // 处理浮点数
        };

        updateValue(value);

        const handleChange = (event: Event) => {
            const value = parseFloat((event.target as HTMLInputElement).value);  // 处理浮点数
            updateValue(value);
            if (fn) {
                fn(event, { value: value });
            }
        };

        sliderElem.addEventListener('input', handleChange);
        sliderElem.addEventListener('change', handleChange);

        return {
            elem: parent,
            updateValue: (v: number) => {
                sliderElem.value = (v).toString();  // 处理浮点数
                updateValue(v);
            },
        };
    }

    public makeSlider(options: SliderOptions) {
        const div = document.createElement("div");
        return this.createSlider(div, options);
    }

    private getWidgetId() {
        return "__widget_" + this.widgetId++;
    }

    private widgetId = 0;

    public makeCheckbox(options: CheckboxOptions) {
        const div = document.createElement("div");
        div.className = "gman-widget-outer";
        const label = document.createElement("label");
        const id = this.getWidgetId();
        label.setAttribute('for', id);
        label.textContent = this.gopt["ui-" + options.name] || options.name;
        label.className = "gman-checkbox-label";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.checked = options.value;
        input.id = id;
        input.className = "gman-widget-checkbox";
        div.appendChild(label);
        div.appendChild(input);
        input.addEventListener('change', function (e) {
            options.change(e, {
                value: (e.target as HTMLInputElement).checked,
            });
        });

        return {
            elem: div,
            updateValue: function (v: boolean) {
                input.checked = !!v;
            },
        };
    }

    public makeOption(options: OptionOptions) {
        const div = document.createElement("div");
        div.className = "gman-widget-outer";
        const label = document.createElement("label");
        const id = this.getWidgetId();
        label.setAttribute('for', id);
        label.textContent = this.gopt["ui-" + options.name] || options.name;
        label.className = "gman-widget-label";
        const selectElem = document.createElement("select");
        options.options.forEach((name, ndx) => {
            const opt = document.createElement("option");
            opt.textContent = this.gopt["ui-" + name] || name;
            opt.value = ndx.toString();
            opt.selected = ndx === options.value;
            selectElem.appendChild(opt);
        });
        selectElem.className = "gman-widget-select";
        div.appendChild(label);
        div.appendChild(selectElem);
        selectElem.addEventListener('change', function (e) {
            options.change(e, {
                value: selectElem.selectedIndex,
            });
        });

        return {
            elem: div,
            updateValue: function (v: number) {
                selectElem.selectedIndex = v;
            },
        };
    }

    private noop() { }

    public genSlider(object: any, ui: UIInfo) {
        const changeFn = ui.change || this.noop;
        ui.name = ui.name || ui.key;
        ui.value = object[ui.key];
        ui.slide = ui.slide || ((event, uiInfo) => {
            object[ui.key] = uiInfo.value;
            changeFn();
        });
        return this.makeSlider(ui as SliderOptions);
    }

    public genCheckbox(object: any, ui: UIInfo) {
        const changeFn = ui.change || this.noop;
        ui.value = object[ui.key];
        ui.name = ui.name || ui.key;
        ui.change = (event, uiInfo) => {
            object[ui.key] = uiInfo.value;
            changeFn();
        };
        return this.makeCheckbox(ui as CheckboxOptions);
    }

    public genOption(object: any, ui: UIInfo) {
        const changeFn = ui.change || this.noop;
        ui.value = object[ui.key];
        ui.name = ui.name || ui.key;
        ui.change = (event, uiInfo) => {
            object[ui.key] = uiInfo.value;
            changeFn();
        };
        return this.makeOption(ui as OptionOptions);
    }

    private uiFuncs: { [key: string]: (object: any, ui: UIInfo) => any } = {
        slider: this.genSlider.bind(this),
        checkbox: this.genCheckbox.bind(this),
        option: this.genOption.bind(this),
    };

    public setupUI(parent: HTMLElement, object: any, uiInfos: UIInfo[]) {
        const widgets: Widgets = {};
        uiInfos.forEach((ui) => {
            const widget = this.uiFuncs[ui.type](object, ui);
            parent.appendChild(widget.elem);
            widgets[ui.key] = widget;
        });
        return widgets;
    }

    public updateUI(widgets: Widgets, data: any) {
        Object.keys(widgets).forEach((key) => {
            const widget = widgets[key];
            widget.updateValue(data[key]);
        });
    }

    private getQueryParams() {
        const params: { [key: string]: string } = {};
        if ((window as any).hackedParams) {
            Object.keys((window as any).hackedParams).forEach((key) => {
                params[key] = (window as any).hackedParams[key];
            });
        }
        if (window.location.search) {
            window.location.search.substring(1).split("&").forEach((pair) => {
                const keyValue = pair.split("=").map((kv) => {
                    return decodeURIComponent(kv);
                });
                params[keyValue[0]] = keyValue[1];
            });
        }
        return params;
    }
}
