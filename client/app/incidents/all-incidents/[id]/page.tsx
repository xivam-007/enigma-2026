"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  MapPin,
  ShieldAlert,
  Activity,
  Maximize2,
  Database,
  ShieldCheck,
  Zap,
  Truck,
  Siren,
  Anchor,
} from "lucide-react";
import { incidentService, type Incident } from "@/services/incidentService";

// --- Interfaces ---
export interface Resource {
  _id: string;
  name: string;
  type: "FIRE_TRUCK" | "AMBULANCE" | "POLICE" | "BOAT" | "NDRF";
  status: "AVAILABLE" | "ASSIGNED" | "IN_TRANSIT" | "ARRIVED";
  location: string;
  currentIncident: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ResourceType = Resource["type"];

const RESOURCE_TYPES: ResourceType[] = [
  "FIRE_TRUCK",
  "AMBULANCE",
  "POLICE",
  "BOAT",
  "NDRF",
];

const RESOURCE_CONFIG: Record<ResourceType, { color: string; icon: any }> = {
  FIRE_TRUCK: { color: "text-red-500", icon: Truck },
  AMBULANCE: { color: "text-emerald-500", icon: Activity },
  POLICE: { color: "text-blue-500", icon: Siren },
  BOAT: { color: "text-cyan-500", icon: Anchor },
  NDRF: { color: "text-orange-500", icon: ShieldCheck },
};

const IncidentPage = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [orderQuantities, setOrderQuantities] = useState<
    Record<ResourceType, number>
  >({
    FIRE_TRUCK: 0,
    AMBULANCE: 0,
    POLICE: 0,
    BOAT: 0,
    NDRF: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await incidentService.getIncidentById(id);
        if (response?.success && response.data) {
          setIncident(response.data);
        } else {
          setError("Incident not found.");
        }

        const resourcesResponse = await incidentService.getAllResources();
        if (
          resourcesResponse?.success &&
          Array.isArray(resourcesResponse.data)
        ) {
          setResources(resourcesResponse.data);
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
      case "open":
        return "text-red-500 border-red-500/30 bg-red-500/5";
      case "resolved":
        return "text-blue-500 border-blue-500/30 bg-blue-500/5";
      default:
        return "text-slate-400 border-slate-700 bg-slate-800/50";
    }
  };

  const handleQuantityChange = (
    type: ResourceType,
    value: string,
    maxAvailable: number,
  ) => {
    let parsedValue = parseInt(value, 10);
    if (isNaN(parsedValue)) parsedValue = 0;
    if (parsedValue < 0) parsedValue = 0;
    if (parsedValue > maxAvailable) parsedValue = maxAvailable;
    setOrderQuantities((prev) => ({ ...prev, [type]: parsedValue }));
  };

  const handlePlaceOrder = async () => {
    if (!incident) return;
    const resourcesToOrder: Resource[] = [];

    RESOURCE_TYPES.forEach((type) => {
      const qtyRequested = orderQuantities[type];
      if (qtyRequested > 0) {
        const available = resources.filter(
          (r) => r.type === type && r.status === "AVAILABLE",
        );
        resourcesToOrder.push(...available.slice(0, qtyRequested));
      }
    });

    if (resourcesToOrder.length === 0) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        resourcesToOrder.map((r) =>
          incidentService.assignResourceToIncident(r._id, incident._id),
        ),
      );
      setOrderQuantities({
        FIRE_TRUCK: 0,
        AMBULANCE: 0,
        POLICE: 0,
        BOAT: 0,
        NDRF: 0,
      });
      router.back();
    } catch (error) {
      alert("Error assigning resources.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="h-16 w-16 rounded-full border-t-2 border-cyan-500 animate-spin" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-cyan-500">
          Establishing Data Link...
        </p>
      </div>
    );

  if (!incident) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-4">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft
                size={16}
                className="group-hover:-translate-x-1 transition-transform"
              />{" "}
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tight italic">
                {incident.title}
              </h1>
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 mt-2">
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 underline uppercase">
                  UID: {incident._id}
                </span>
                <span className="flex items-center gap-2 uppercase">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />{" "}
                  Sensor: Verified
                </span>
              </div>
            </div>
          </div>
          <div
            className={`px-6 py-2 rounded-md border text-[10px] font-black uppercase tracking-widest shadow-lg ${getStatusStyle(incident.status)}`}
          >
            Status: {incident.status}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Briefing Box */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-cyan-500" /> Situation Briefing
              </h2>
              <p className="text-slate-300 leading-relaxed font-medium">
                {incident.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-800/50">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Coordinates
                  </span>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <MapPin size={14} className="text-cyan-500" />{" "}
                    {incident.location}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </span>
                  <div className="flex items-center justify-end gap-2 text-white font-mono text-xs">
                    <Clock size={14} className="text-cyan-500" />{" "}
                    {new Date(incident.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation Box */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-xs font-black text-cyan-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-cyan-500" /> Strategic Resource
                Allocation
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {RESOURCE_TYPES.map((type) => {
                  const availableCount = resources.filter(
                    (r) => r.type === type && r.status === "AVAILABLE",
                  ).length;
                  const config = RESOURCE_CONFIG[type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={type}
                      className={`bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between text-center transition-all ${orderQuantities[type] > 0 ? "border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.1)]" : ""}`}
                    >
                      <Icon size={24} className={`${config.color} mb-2`} />
                      <h3 className="font-black text-[9px] uppercase tracking-widest text-slate-400 mb-4">
                        {type.replace("_", " ")}
                      </h3>
                      <div className="w-full space-y-3">
                        <div
                          className={`text-[10px] font-mono ${availableCount === 0 ? "text-red-500" : "text-slate-500"}`}
                        >
                          [{availableCount}] Available
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={availableCount}
                          disabled={availableCount === 0}
                          value={orderQuantities[type]}
                          onChange={(e) =>
                            handleQuantityChange(
                              type,
                              e.target.value,
                              availableCount,
                            )
                          }
                          className="w-full text-center bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white focus:border-cyan-500 outline-none font-bold disabled:opacity-20 transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    Object.values(orderQuantities).every((qty) => qty === 0) ||
                    isSubmitting
                  }
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black px-8 py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] active:scale-95"
                >
                  {isSubmitting
                    ? "Transmitting Data..."
                    : "Confirm Resource Deployment"}
                </button>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-24 group">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Maximize2 size={12} /> Intel Scan
                </h2>
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              </div>
              <div className="relative aspect-[4/5] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                {incident.image ? (
                  <img
                    src={incident.image}
                    alt="Visual Uplink"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 space-y-3">
                    <ShieldAlert size={40} className="opacity-10" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      No Visual Data
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none border-[15px] border-slate-950/20" />
                <div className="absolute top-4 left-4 h-4 w-4 border-t-2 border-l-2 border-cyan-500/50" />
                <div className="absolute bottom-4 right-4 h-4 w-4 border-b-2 border-r-2 border-cyan-500/50" />
              </div>
              <div className="mt-4 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <div className="flex justify-between items-center text-[9px] font-mono text-cyan-500 uppercase mb-1">
                  <span>Sync Status</span> <span>Encrypted</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 w-[94%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentPage;
