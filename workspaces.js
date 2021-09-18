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

const { Clutter, GObject, St, Shell } = imports.gi;

const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const WM = global.workspace_manager;

var WorkspaceButton = GObject.registerClass(
class WorkspaceButton extends PanelMenu.Button {
    _init(workspace_index) {
        super._init(0.0, 'WorkspaceButton');

        this.ws_button = new St.BoxLayout({
            visible: true,
            reactive: true, 
            can_focus: true, 
            track_hover: true
        });
        this.add_child(this.ws_button);

        this.ws = WM.get_workspace_by_index(workspace_index);
        this.window_tracker = Shell.WindowTracker.get_default();

        if(this.ws.list_windows().length == 0) {
            this.ws_button.add_child(new St.Icon({
                icon_name: 'list-add-symbolic', 
                style_class: 'system-status-icon'
            }));
        } else {
            // Need to reverse the list so the icons are in the correct order
            for (const window of this.ws.list_windows().reverse()) {
                
                let window_app = this.window_tracker.get_window_app(window);
                this.ws_button.add_child(new WindowButton(window_app));
                
                let item = new PopupMenu.PopupImageMenuItem(window_app.get_name(), window_app.get_icon());
                item.connect('activate', () => window_app.activate());
                this.menu.addMenuItem(item);
            }
        }
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
    
    _destroy() {
        super.destroy();
    }
});

var WindowButton = GObject.registerClass(
class WindowButton extends St.Icon {
    _init(app) { 
        super._init({visible: true, reactive: true, can_focus: true, track_hover: true});

        this.app = app;
        this.style_class = 'system-status-icon';
        this.gicon = app.get_icon();
    }
});
    

this.init = function() {
    this.window_tracker = Shell.WindowTracker.get_default();

    this.display_workspaces();

    // signals
    this.ws_number_changed = WM.connect('notify::n-workspaces', this.display_workspaces.bind(this));
    this.active_ws_changed = WM.connect('active-workspace-changed', this.display_workspaces.bind(this));
    this.windows_changed = this.window_tracker.connect('tracked-windows-changed', this.display_workspaces.bind(this));
    this.restacked = global.display.connect('restacked', this.display_workspaces.bind(this));
}

this.destroy_buttons = function() {
    if(this.ws_buttons) {
        for (const button of this.ws_buttons) {
            button.destroy();
        }

        this.ws_buttons = null;
    }
}

this.display_workspaces = function() {
    this.destroy_buttons();
    this.ws_buttons = [];
    this.ws_count = WM.get_n_workspaces();
    this.active_ws_index = WM.get_active_workspace_index();

    // Need to go reverse so the workspaces are in the right order
    for (let ws_index = this.ws_count-1; ws_index >= 0; --ws_index) {
        let workspace_button = new WorkspaceButton(ws_index);
        this.ws_buttons.push(workspace_button);
        Main.panel.addToStatusArea('workspace-' + ws_index + '-button', workspace_button, 3, 'left');
    }
}

this.destroy = function() {
    if (this.ws_number_changed) {
        WM.disconnect(this.ws_number_changed);
    }

    if (this.active_ws_changed) {
        WM.disconnect(this.active_ws_changed);
    }

    if (this.window_tracker && this.windows_changed) {
        this.window_tracker.disconnect(this.windows_changed);
    }

    if (this.restacked) {
        global.display.disconnect(this.restacked);
    }

    this.destroy_buttons();
}