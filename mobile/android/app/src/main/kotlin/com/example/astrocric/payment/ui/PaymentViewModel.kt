package com.example.astrocric.payment.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.astrocric.payment.data.UpiApp
import com.example.astrocric.payment.domain.UpiPaymentManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PaymentViewModel(private val upiPaymentManager: UpiPaymentManager) : ViewModel() {

    private val _upiApps = MutableStateFlow<List<UpiApp>>(emptyList())
    val upiApps: StateFlow<List<UpiApp>> = _upiApps.asStateFlow()

    init {
        loadInstalledApps()
    }

    private fun loadInstalledApps() {
        viewModelScope.launch {
            _upiApps.value = upiPaymentManager.getInstalledUpiApps()
        }
    }
}
