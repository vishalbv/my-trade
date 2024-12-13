import _shoonya from "../../../states/shoonya";

export const modifyOrder = async (req: Request) => {
  const { norenordno, price } = await req.json();

  try {
    const response = await _shoonya.modifyOrder(norenordno, price);
    return new Response(JSON.stringify(response), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Error modifying order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};

export const cancelOrder = async (req: Request) => {
  const { norenordno } = await req.json();

  try {
    const response = await _shoonya.cancelOrder(norenordno);
    return new Response(JSON.stringify(response), {
      status: 200,
    });
  } catch (error: any) {
    console.error("Error canceling order:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
