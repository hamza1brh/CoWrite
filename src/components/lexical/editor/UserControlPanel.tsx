import { Fragment } from "react";

interface UserProfile {
  name: string;
  color: string;
}

interface ActiveUserProfile extends UserProfile {
  userId: number;
}

interface UserControlPanelProps {
  userProfile: UserProfile;
  onUserProfileChange: (profile: UserProfile) => void;
  connected: boolean;
  activeUsers: ActiveUserProfile[];
}

export default function UserControlPanel({
  userProfile,
  onUserProfileChange,
  connected,
  activeUsers,
}: UserControlPanelProps) {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-4">
        {/* User Name Input */}
        <div className="flex items-center gap-2">
          <label className="text-slate-600 dark:text-slate-300">Name:</label>
          <input
            type="text"
            value={userProfile.name}
            onChange={e =>
              onUserProfileChange({
                ...userProfile,
                name: e.target.value,
              })
            }
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="Your name"
          />
        </div>

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-slate-600 dark:text-slate-300">Color:</label>
          <input
            type="color"
            value={userProfile.color}
            onChange={e =>
              onUserProfileChange({
                ...userProfile,
                color: e.target.value,
              })
            }
            className="h-8 w-12 rounded border border-slate-300 bg-white focus:border-blue-500 focus:outline-none dark:border-slate-600"
          />
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300">Status:</span>
          <div className="flex items-center gap-1">
            <div
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span
              className={`font-medium ${
                connected
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        {/* Active Users */}
        {activeUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600 dark:text-slate-300">Active:</span>
            <div className="flex gap-1">
              {activeUsers.map(({ name, color, userId }, idx) => (
                <Fragment key={userId}>
                  <span
                    className="rounded px-2 py-1 text-xs font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {name}
                  </span>
                  {idx < activeUsers.length - 1 && (
                    <span className="text-slate-400">,</span>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
