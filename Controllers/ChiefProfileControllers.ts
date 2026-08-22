import type {Request,Response} from "express";
import ChiefProfileServices from "../Services/ChiefProfileServices";

class ChiefProfileController {

    async create(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.createProfile(req.body);
            res.status(201).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getById(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getProfileById(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(404).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getAll(req:Request, res:Response) {
        try {
            const filter = req.query || {};
            const result = await ChiefProfileServices.getAllProfiles(filter);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async update(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.updateProfile(req.params.id, req.body);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async delete(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.deleteProfile(req.params.id);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async verify(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.verifyProfile(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async verifyStep(req:Request, res:Response) {
        try {
            const { step, status } = req.body;
            const result = await ChiefProfileServices.verifyStep(req.params.id as string, step, status);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getVerificationSteps(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getVerificationSteps(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadCommercialRegister(req:Request, res:Response) {
        try {
            const { certificateUrl } = req.body;
            if (!certificateUrl) {
                res.status(400).json({ status: "error", message: "certificateUrl is required" });
                return;
            }
            const result = await ChiefProfileServices.uploadCommercialRegister(req.params.id as string, certificateUrl);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadPaymentMethod(req:Request, res:Response) {
        try {
            const { provider, details } = req.body;
            if (!provider || !details) {
                res.status(400).json({ status: "error", message: "provider and details are required" });
                return;
            }
            const result = await ChiefProfileServices.uploadPaymentMethod(req.params.id as string, { provider, details });
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadNationalId(req:Request, res:Response) {
        try {
            const { frontImageURL, backImageURL } = req.body;
            if (!frontImageURL || !backImageURL) {
                res.status(400).json({ status: "error", message: "frontImageURL and backImageURL are required" });
                return;
            }
            const result = await ChiefProfileServices.uploadNationalId(req.params.id as string, frontImageURL, backImageURL);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    // ── Jewar shop onboarding steps ──

    async updateShopInfo(req:Request, res:Response) {
        try {
            const { name, shop_cover, Category_id, Subcategory_id } = req.body;
            if (!name && !shop_cover && !Category_id && !Subcategory_id) {
                res.status(400).json({ status: "error", message: "Provide at least one of: name, shop_cover, Category_id, Subcategory_id" });
                return;
            }
            const result = await ChiefProfileServices.updateShopInfo(req.params.id as string, { name, shop_cover, Category_id, Subcategory_id });
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async updateShopAddress(req:Request, res:Response) {
        try {
            const { shop_address } = req.body;
            if (!shop_address || !String(shop_address).trim()) {
                res.status(400).json({ status: "error", message: "shop_address is required" });
                return;
            }
            const result = await ChiefProfileServices.updateShopAddress(req.params.id as string, String(shop_address).trim());
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadTaxRecord(req:Request, res:Response) {
        try {
            const { taxRecordUrl } = req.body;
            if (!taxRecordUrl) {
                res.status(400).json({ status: "error", message: "taxRecordUrl is required" });
                return;
            }
            const result = await ChiefProfileServices.uploadTaxRecord(req.params.id as string, taxRecordUrl);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async uploadTaxCard(req:Request, res:Response) {
        try {
            const { taxCardUrl } = req.body;
            if (!taxCardUrl) {
                res.status(400).json({ status: "error", message: "taxCardUrl is required" });
                return;
            }
            const result = await ChiefProfileServices.uploadTaxCard(req.params.id as string, taxCardUrl);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async submitForReview(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.submitForReview(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(400).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async getPendingVerifications(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.getPendingVerifications();
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async approveVerification(req:Request, res:Response) {
        try {
            const result = await ChiefProfileServices.approveVerification(req.params.id as string);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async rejectVerification(req:Request, res:Response) {
        try {
            const { reason } = req.body;
            const result = await ChiefProfileServices.rejectVerification(req.params.id as string, reason);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }

    async rejectSteps(req:Request, res:Response) {
        try {
            const { steps, reason } = req.body;
            const result = await ChiefProfileServices.rejectSteps(req.params.id as string, steps, reason);
            res.status(200).json(result);
        } catch (error:unknown) {
            res.status(500).json({
                status: "error",
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }


  // â”€â”€ Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async createOrder(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.createOrder(req.body);
      res.status(201).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getChefOrders(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getOrdersByChef(req.params.chefId);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getCustomerOrders(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getOrdersByCustomer(req.params.customerId);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getOrderById(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getOrderById(req.params.id);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(404).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async verifyPayment(req:Request, res:Response) {
    try {
      const { status, chef_id } = req.body;
      const result = await ChiefProfileServices.verifyPayment(req.params.id, status, chef_id);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async acceptOrder(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.acceptOrder(req.params.id);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async updateOrderStatus(req:Request, res:Response) {
    try {
      const { order_status } = req.body;
      const result = await ChiefProfileServices.updateOrderStatus(req.params.id, order_status);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async settleChefEarnings(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.settleChefEarnings(req.params.id);
      res.status(200).json(result);
    } catch (error:unknown) {
      const e = error as Error;
      res.status(400).json({ status: "error", message: e.message });
    }
  }

  async getPendingPayments(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getPendingPayments();
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getChefEarnings(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getChefEarnings(req.params.chefId);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async setShopStatus(req:Request, res:Response) {
    try {
      const { shop_open } = req.body;
      const result = await ChiefProfileServices.setShopStatus(req.params.id, shop_open);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // â”€â”€ Driver Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async getAvailableOrdersForDriver(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getAvailableOrdersForDriver();
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async acceptOrderDriver(req:Request, res:Response) {
    try {
      const { driver_id } = req.body;
      const result = await ChiefProfileServices.acceptOrderDriver(req.params.id, driver_id);
      res.status(200).json(result);
    } catch (error:unknown) {
      const e = error as Error;
      res.status(400).json({ status: "error", message: e.message });
    }
  }

  async deliverOrderDriver(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.deliverOrderDriver(req.params.id);
      res.status(200).json(result);
    } catch (error:unknown) {
      const e = error as Error;
      res.status(400).json({ status: "error", message: e.message });
    }
  }

  async getDriverOrders(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getDriverOrders(req.params.driverId);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async rateOrder(req:Request, res:Response) {
    try {
      const { rating, driver_rating, comment } = req.body;
      const result = await ChiefProfileServices.rateOrder(req.params.id, rating, driver_rating, comment);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAllOrders(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getAllOrders();
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  // ── Advertising ──────────────────────────────────────────────

  async createAd(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.createAd(req.body);
      res.status(201).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getActiveAds(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getActiveAds();
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async getAdsByOwner(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.getAdsByOwner(req.params.ownerId);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(500).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async updateAd(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.updateAd(req.params.id, req.body);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

  async deleteAd(req:Request, res:Response) {
    try {
      const result = await ChiefProfileServices.deleteAd(req.params.id);
      res.status(200).json(result);
    } catch (error:unknown) {
      res.status(400).json({
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }

}

export default new ChiefProfileController();

