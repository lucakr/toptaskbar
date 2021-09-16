/* shortcuts.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const GETTEXT_DOMAIN = 'toptaskbar@lucakr.github.io';

const { GObject, St, Shell, Clutter } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Actions = Me.imports.actions;
const WM = global.workspace_manager;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

// var WorkspaceManager = GObject.registerClass(
// class WorkspaceManager extends PanelMenu.
// )

var WorkspaceButton = GObject.registerClass(
class WorkspaceButton extends PanelMenu.Button {
    _init(workspace_index) {
        super._init(0.0, 'WorkspaceButton');

        // tracker for windows
		this.window_tracker = Shell.WindowTracker.get_default();
        
        this.ws_button = new St.BoxLayout({
            visible: true,
            reactive: true, 
            can_focus: true, 
            track_hover: true
        });

        this.ws = WM.get_workspace_by_index(workspace_index);

        this.windows_changed = this.window_tracker.connect('tracked-windows-changed', this._display_windows.bind(this));
		        
        this.add_child(this.ws_button);

        this._display_windows();
        
    }

    vfunc_event(event) {
        if(event.get_button() == 1 &&
           (event.type() == Clutter.EventType.TOUCH_BEGIN ||
            event.type() == Clutter.EventType.BUTTON_PRESS)) {

            if(this.menu && (this.menu.isOpen || (WM.get_active_workspace() == this.ws))) {
                this.menu.toggle();
            } else {
                this.ws.activate(global.get_current_time());
		        Main.overview.hide();
            }
        }

        if (this.menu &&
            event.get_button() == 3 &&
            (event.type() == Clutter.EventType.TOUCH_BEGIN ||
             event.type() == Clutter.EventType.BUTTON_PRESS))
            this.menu.toggle();

        return Clutter.EVENT_PROPAGATE;
    }

    _display_windows() {
        // destroy old icons
        this.ws_button.destroy_all_children();

        // destroy old menu items
        if (this.menu) {
            this.menu.removeAll();
        }

        // create window items
        for (const window of this.ws.list_windows()) {
            let window_app = this.window_tracker.get_window_app(window);

            this.ws_button.add_child(window_app.create_icon_texture(16));
            
            let item = new PopupMenu.PopupImageMenuItem(window_app.get_name(), window_app.get_icon());
            item.connect('activate', () => window_app.activate());
            this.menu.addMenuItem(item);
        }
    }
    
    _destroy() {
        if (this.windows_changed) {
            this.window_tracker.disconnect(this.windows_changed);
        }
        super.destroy();
    }
});

var WindowButton = GObject.registerClass(
class WindowButton extends St.Icon {
    _init() { 
        super._init({visible: true, reactive: true, can_focus: true, track_hover: true});
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        Actions.init();

        this.workspace_button = new WorkspaceButton(1);
        Main.panel.addToStatusArea('workspace-button', this.workspace_button, 2, 'left');
    }

    disable() {
        Actions.destroy();

        this.workspace_button.destroy();
        this.workspace_button = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
