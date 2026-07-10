<?php
namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Table;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class OrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
   public function index(Request $request)
    {
        $user = auth()->user();

        $query = Order::with(['customer', 'table', 'items.menuItem']);

        // Filter by period  
        switch ($request->query('period')) {
            case 'day':
                $query->today();
                break;
            case 'week':
                $query->thisWeek();
                break;
            case 'month':
                $query->thisMonth();
                break;
            default:
                break;
        }
        
        // Filter by table
        if ($request->query('table_id')) {
            $query->forTable($request->query('table_id'));
        }

        // Filter by customer
        if ($request->query('table_id')) {
            $query->forCustomer($request->query('customer_id'));
        }

        $orders = $query->orderBy('created_at', 'asc')->get();
        return response()->json($orders);
    }  

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Validate the request
            $validated = $request->validate([
                'table_id' => 'required|exists:tables,id',
                'customer_id' => 'required|exists:customers,id',
                'notes' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.menu_item_id' => 'required|exists:menu_items,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.notes' => 'nullable|string',
            ]);

            DB::beginTransaction();

            // Create the order
            $order = Order::create([
                'table_id' => $validated['table_id'],
                'customer_id' => $validated['customer_id'],
                'waiter_id' => auth()->id(),
                'status' => 'pending',
                'total_amount' => 0,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update table status
            $table = Table::find($validated['table_id']);
            $table->update(['status' => 'occupied']);

            $totalAmount = 0;

            // Create order items
            foreach ($validated['items'] as $item) {
                $menuItem = MenuItem::find($item['menu_item_id']);
                $subtotal = $menuItem->price * $item['quantity'];
                $totalAmount += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $item['menu_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $menuItem->price,
                    'subtotal' => $subtotal,
                    'notes' => $item['notes'] ?? null,
                    'status' => 'pending',
                ]);
            }

            // Update order total
            $order->update(['total_amount' => $totalAmount]);

            DB::commit();

            return response()->json($order->load(['customer', 'table', 'waiter', 'items.menuItem']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Order $order)
    {
        return response()->json($order->load(['customer', 'table', 'items.menuItem']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'sometimes|required|in:pending,in_progress,completed,cancelled',
            'notes' => 'sometimes|nullable|string',
        ]);

        $order->update($validated);

        if (in_array($order->status, ['completed', 'cancelled'])) {
            $order->table->update(['status' => 'available']);
        }

        return response()->json($order->load(['customer', 'table', 'items.menuItem']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Order $order)
    {
        // Check if order can be deleted 
        if ($order->status !== 'pending') {
            return response()->json(['message' => 'Only pending orders can be deleted'], 403);
        }

        try {
            DB::beginTransaction();

            $order->items()->delete();
            $order->table->update(['status' => 'available']);
            $order->delete();

            DB::commit();

            return response()->json(['message' => 'Order deleted successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting order: ' . $e->getMessage()], 500);
        }
    }

    public function waiterOrders(Request $request) {

        $user = auth()->user();

        if (!$user->isWaiter()) {
            return response()->json(['message' => 'Only waiters can access this endpoint'], 403);
        }

        $orders = Order::where('status', 'pending')
            ->with(['customer', 'table', 'items.menuItem'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function cookOrders(Request $request) {
    
        $user = auth()->user();

        if(!$user->isCook()) {
            return response()->json(['message'=> 'Only cooks can access this endpoint'], 200);
        }

        $orders = Order::whereIn('status', ['pending', 'in_progress'])
            ->with(['customer', 'table', 'items.menuItem'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }
}