export interface AllocationWindow {
    start: string;
    end: string;
    }
    
    export interface AllocationProperties {
    cluster?: string;
    namespace?: string;
    pod?: string;
    }
    
    export interface PersistentVolumeAllocation {
    byteHours: number;
    cost: number;
    providerID: string;
    adjustment: number;
    }
    
    export interface LoadBalancerAllocation {
    service: string;
    cost: number;
    private: boolean;
    ip: string;
    hours: number;
    adjustment: number;
    }
    
    export interface GPUAllocation {
    isGPUShared: boolean | null;
    gpuUsageAverage: number;
    gpuRequestAverage: number;
    }
    
    export type SharedCostBreakdown = Record<string, number>;
    
    export type ProportionalAssetResourceCosts = Record<
    string,
    Record<string, number>
    
    > ;
    
    export interface AllocationItem {
    name: string;
    properties: AllocationProperties;
    window: AllocationWindow;
    start: string;
    end: string;
    minutes: number;
    
    cpuCores: number;
    cpuCoreRequestAverage: number;
    cpuCoreLimitAverage: number;
    cpuCoreHours: number;
    cpuCost: number;
    cpuCostAdjustment: number;
    cpuCostIdle: number;
    cpuEfficiency: number;
    
    gpuCount: number;
    gpuHours: number;
    gpuCost: number;
    gpuCostAdjustment: number;
    gpuCostIdle: number;
    gpuEfficiency: number;
    
    networkTransferBytes: number;
    networkReceiveBytes: number;
    networkCost: number;
    networkCrossZoneCost: number;
    networkCrossRegionCost: number;
    networkInternetCost: number;
    networkNatGatewayEgressCost: number;
    networkNatGatewayIngressCost: number;
    networkCostAdjustment: number;
    
    loadBalancerCost: number;
    loadBalancerCostAdjustment: number;
    
    pvBytes: number;
    pvByteHours: number;
    pvCost: number;
    pvCostAdjustment: number;
    
    ramBytes: number;
    ramByteRequestAverage: number;
    ramByteLimitAverage: number;
    ramByteUsageAverage: number;
    ramByteHours: number;
    ramCost: number;
    ramCostAdjustment: number;
    ramCostIdle: number;
    ramEfficiency: number;
    
    externalCost: number;
    sharedCost: number;
    totalCost: number;
    totalEfficiency: number;
    
    pvs?: Record<string, PersistentVolumeAllocation>;
    lbAllocations?: Record<string, LoadBalancerAllocation>;
    sharedCostBreakdown?: SharedCostBreakdown;
    proportionalAssetResourceCosts?: ProportionalAssetResourceCosts;
    gpuAllocation?: GPUAllocation;
    }
    
    export interface AllocationSet {
    [allocationName: string]: AllocationItem;
    }
    
    export interface OpenCostAllocationResponse {
    code: number;
    data: AllocationSet[];
    }
    